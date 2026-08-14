import { describe, expect, it, vi } from 'vitest'
import {
  detectPetStatus,
  harnessAssistantText,
  harnessConversationTitle,
  observeHarnessSignals,
  sendHarnessFollowup,
  type HarnessContext,
  type SignalSnapshot,
  type SnapshotSource,
} from '../src/adapters/deepseek-harness.js'

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

describe('detectPetStatus', () => {
  const states: Array<[string, SignalSnapshot]> = [
    ['idle', {}],
    ['thinking', { partial: { blocks: [] } }],
    ['working', { running: true }],
    ['searching', { runningCalls: [{ name: 'web_search' }] }],
    ['bash', { runningCalls: [{ name: 'pwsh' }] }],
    ['editing', { runningCalls: [{ name: 'str-replace-editor' }] }],
    ['waiting', { pending: [{}] }],
    ['error', { promptError: {} }],
    ['success', { derivedSuccess: true }],
  ]

  it.each(states)('detects %s', (status, snapshot) => {
    expect(detectPetStatus(snapshot)).toBe(status)
  })

  it('applies error > success > waiting > specialized tool > working > thinking', () => {
    const all: SignalSnapshot = {
      promptError: {},
      derivedSuccess: true,
      pending: [{}],
      runningCalls: [{ name: 'web_search' }],
      running: true,
      partial: { blocks: [] },
    }
    expect(detectPetStatus(all)).toBe('error')
    expect(detectPetStatus({ ...all, promptError: null })).toBe('success')
    expect(detectPetStatus({ ...all, promptError: null, derivedSuccess: false })).toBe('waiting')
    expect(detectPetStatus({ ...all, promptError: null, derivedSuccess: false, pending: [] })).toBe('searching')
    expect(detectPetStatus({ running: true, partial: { blocks: [] } })).toBe('working')
  })

  it('uses the latest finalized node for turn errors', () => {
    expect(detectPetStatus({ nodes: [{ kind: 'turn-error' }] })).toBe('error')
    expect(detectPetStatus({ nodes: [{ kind: 'turn-error' }, { kind: 'assistant' }] })).toBe('idle')
  })

  it.each([
    { lastAgentError: 'agent failed' },
    { connection: 'reconnecting' },
  ] satisfies SignalSnapshot[])('detects every live error channel', (snapshot) => {
    expect(detectPetStatus(snapshot)).toBe('error')
  })

  it('detects only queued queue placements as waiting', () => {
    expect(detectPetStatus({ queue: [{ placement: 'queued' }] })).toBe('waiting')
    expect(detectPetStatus({ queue: [{ placement: 'steering' }] })).toBe('idle')
  })

  it('degrades unknown tools to working and unknown signals to idle', () => {
    expect(detectPetStatus({ runningCalls: [{ name: 'future_tool' }] })).toBe('working')
    expect(detectPetStatus({ partial: 'malformed' })).toBe('idle')
    expect(detectPetStatus({ futureSignal: true } as SignalSnapshot)).toBe('idle')
  })
})

describe('harnessConversationTitle', () => {
  it('uses the latest finalized local user or steering text', () => {
    expect(harnessConversationTitle({
      nodes: [
        { kind: 'user', content: [{ type: 'text', text: '第一条问题' }] },
        { kind: 'assistant', content: [{ type: 'text', text: '回答' }] },
        { kind: 'steering', content: [{ type: 'text', text: '  最新要求  ' }] },
      ],
    })).toBe('最新要求')
  })

  it('falls back to the latest local queue preview', () => {
    expect(harnessConversationTitle({ queue: [{ text: '等待中问题' }] })).toBe('等待中问题')
    expect(harnessConversationTitle({ queue: [{ preview: '预览文字' }] })).toBe('预览文字')
  })

  it('ignores assistant text and malformed unknown content', () => {
    expect(harnessConversationTitle({ nodes: [{ kind: 'assistant', content: [{ type: 'text', text: '不显示' }] }] })).toBeUndefined()
    expect(harnessConversationTitle({ nodes: [{ kind: 'user', content: [{ type: 'image', text: '不显示' }, null] }] })).toBeUndefined()
  })
})

describe('harnessAssistantText', () => {
  it('prefers live partial text over the finalized answer', () => {
    expect(harnessAssistantText({
      partial: { blocks: [{ kind: 'text', text: '正在实时输出' }] },
      nodes: [{ kind: 'assistant', blocks: [{ kind: 'text', text: '上一条回答' }] }],
    })).toBe('正在实时输出')
  })

  it('reads the official chat legacy mirror when top-level compatibility fields are absent', () => {
    const snapshot: SignalSnapshot = {
      chat: {
        legacy: {
          partial: { blocks: [{ kind: 'text', text: '镜像中的流式文字' }] },
          nodes: [{ kind: 'user', content: [{ type: 'text', text: '写一篇长文' }] }],
        },
      },
    }
    expect(detectPetStatus(snapshot)).toBe('thinking')
    expect(harnessConversationTitle(snapshot)).toBe('写一篇长文')
    expect(harnessAssistantText(snapshot)).toBe('镜像中的流式文字')
  })

  it('uses the latest finalized assistant text', () => {
    expect(harnessAssistantText({
      nodes: [
        { kind: 'user', content: [{ type: 'text', text: '你好' }] },
        { kind: 'assistant', blocks: [{ kind: 'reasoning', text: '不显示' }, { kind: 'text', text: '你好！在的。' }] },
      ],
    })).toBe('你好！在的。')
  })

  it('clears an older answer once a newer user message is waiting for output', () => {
    expect(harnessAssistantText({
      nodes: [
        { kind: 'assistant', blocks: [{ kind: 'text', text: '旧回答' }] },
        { kind: 'user', content: [{ type: 'text', text: '新问题' }] },
      ],
    })).toBeUndefined()
  })
})

describe('sendHarnessFollowup', () => {
  it('sends trimmed text through the current official session queue', async () => {
    const prompt = vi.fn().mockResolvedValue({ ok: true, value: { accepted: true } })
    const session = Object.assign(new Source<SignalSnapshot>({}), { prompt })
    const context: HarnessContext = {
      sessions: {
        list: new Source({ current: 'current' }),
        binding: () => ({ session }),
      },
      connection: { hostDescription: new Source({ version: 'test' }) },
    }

    await expect(sendHarnessFollowup(context, '  继续检查  ')).resolves.toEqual({ ok: true })
    expect(prompt).toHaveBeenCalledWith([{ type: 'text', text: '继续检查' }], 'queue')
  })

  it('reports missing sessions and official prompt failures', async () => {
    const noSession: HarnessContext = {
      sessions: { list: new Source({}), binding: () => undefined },
      connection: { hostDescription: new Source({ version: 'test' }) },
    }
    await expect(sendHarnessFollowup(noSession, '继续')).resolves.toMatchObject({ ok: false })

    const session = Object.assign(new Source<SignalSnapshot>({}), {
      prompt: vi.fn().mockResolvedValue({ ok: false, error: { message: '发送被拒绝' } }),
    })
    const rejected: HarnessContext = {
      sessions: { list: new Source({ current: 'current' }), binding: () => ({ session }) },
      connection: { hostDescription: new Source({ version: 'test' }) },
    }
    await expect(sendHarnessFollowup(rejected, '继续')).resolves.toEqual({ ok: false, message: '发送被拒绝' })
  })
})

describe('observeHarnessSignals', () => {
  it('switches current-session subscriptions and cleans up every listener', () => {
    const sessionA = new Source<SignalSnapshot>({ running: true })
    const sessionB = new Source<SignalSnapshot>({ partial: { blocks: [] } })
    const list = new Source<{ current?: string }>({ current: 'a' })
    const hostDescription = new Source<unknown>({ version: 'test' })
    const context: HarnessContext = {
      sessions: {
        list,
        binding: (id) => ({ session: id === 'a' ? sessionA : sessionB }),
      },
      connection: { hostDescription },
    }
    const seen: SignalSnapshot[] = []

    const dispose = observeHarnessSignals(context, (snapshot) => seen.push(snapshot))
    expect(list.listeners.size).toBe(1)
    expect(sessionA.listeners.size).toBe(1)
    expect(hostDescription.listeners.size).toBe(1)
    expect(seen.at(-1)?.running).toBe(true)

    list.publish({ current: 'b' })
    expect(sessionA.listeners.size).toBe(0)
    expect(sessionB.listeners.size).toBe(1)
    expect(seen.at(-1)?.partial).toEqual({ blocks: [] })

    hostDescription.publish(undefined)
    expect(seen.at(-1)?.connection).toBe('reconnecting')

    dispose()
    expect(list.listeners.size).toBe(0)
    expect(sessionA.listeners.size).toBe(0)
    expect(sessionB.listeners.size).toBe(0)
    expect(hostDescription.listeners.size).toBe(0)
  })
})
