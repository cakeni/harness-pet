import { describe, expect, it, vi } from 'vitest'
import { startHarnessWhale } from '../src/client/index.js'
import type { HarnessContext, SignalSnapshot, SnapshotSource } from '../src/adapters/deepseek-harness.js'
import type { WhalePetOptions } from '../src/pet/index.js'

class Source<T> implements SnapshotSource<T> {
  readonly listeners = new Set<() => void>()

  constructor(private value: T) {}

  getSnapshot(): T {
    return this.value
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  publish(value: T): void {
    this.value = value
    for (const listener of [...this.listeners]) listener()
  }
}

describe('client lifecycle', () => {
  it('wires replies and follow-up sending, then releases every resource', async () => {
    vi.useFakeTimers()
    const prompt = { kind: 'user', content: [{ type: 'text', text: '检查这个项目' }] }
    const session = Object.assign(new Source<SignalSnapshot>({ running: true, nodes: [prompt] }), {
      prompt: vi.fn().mockResolvedValue({ ok: true, value: { accepted: true } }),
    })
    const list = new Source<{ current?: string }>({ current: 'current' })
    const hostDescription = new Source<unknown>({ version: 'test' })
    const context: HarnessContext = {
      sessions: { list, binding: () => ({ session }) },
      connection: { hostDescription },
    }
    const pet = { setStatus: vi.fn(), dispose: vi.fn() }
    let createOptions: WhalePetOptions | undefined
    const lifecycle = startHarnessWhale(context, (options) => {
      createOptions = options
      return pet
    })

    session.publish({
      running: true,
      nodes: [prompt],
      partial: { blocks: [{ kind: 'text', text: '正在检查' }] },
    })
    expect(pet.setStatus).toHaveBeenLastCalledWith('working', '检查这个项目', '正在检查', 'current')
    session.publish({
      running: true,
      nodes: [prompt],
      partial: { blocks: [{ kind: 'text', text: '正在检查，而且仍在持续输出更多文字' }] },
    })
    expect(pet.setStatus).toHaveBeenLastCalledWith(
      'working',
      '检查这个项目',
      '正在检查，而且仍在持续输出更多文字',
      'current',
    )
    await expect(createOptions?.onFollowup?.('继续')).resolves.toEqual({ ok: true })
    expect(session.prompt).toHaveBeenCalledWith([{ type: 'text', text: '继续' }], 'queue')

    session.publish({ running: false, nodes: [prompt] })
    expect(pet.setStatus).toHaveBeenLastCalledWith('success', '检查这个项目', undefined, 'current')
    expect(list.listeners.size).toBe(1)
    expect(session.listeners.size).toBe(1)
    expect(hostDescription.listeners.size).toBe(1)

    lifecycle.dispose()
    vi.advanceTimersByTime(4_000)

    expect(list.listeners.size).toBe(0)
    expect(session.listeners.size).toBe(0)
    expect(hostDescription.listeners.size).toBe(0)
    expect(pet.dispose).toHaveBeenCalledOnce()
    expect(pet.setStatus).toHaveBeenCalledTimes(4)
    vi.useRealTimers()
  })
})
