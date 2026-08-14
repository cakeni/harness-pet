import { describe, expect, it } from 'vitest'
import {
  animationFrame,
  clampFloatingPosition,
  facingFromMovement,
  hasProgressBubble,
  petDialogPresentation,
  progressLabel,
  shouldFollowAssistantTail,
} from '../src/pet/index.js'

describe('pet visual state', () => {
  it('shows progress for conversational and tool activity', () => {
    expect(hasProgressBubble('thinking')).toBe(true)
    expect(hasProgressBubble('working')).toBe(true)
    expect(hasProgressBubble('searching')).toBe(true)
    expect(hasProgressBubble('idle')).toBe(false)
    expect(hasProgressBubble('success')).toBe(false)
    expect(hasProgressBubble('error')).toBe(false)
    expect(progressLabel('thinking', 'zh-CN')).toBe('正在回复')
    expect(progressLabel('working', 'zh-CN')).toBe('正在处理')
    expect(progressLabel('waiting', 'zh-CN')).toBe('等待你的操作')
    expect(progressLabel('idle')).toBeUndefined()
  })

  it('builds a persistent dialog card around the latest local prompt', () => {
    expect(petDialogPresentation('idle', '  我该咋使用这个软件  ', 'zh-CN')).toEqual({
      title: '我该咋使用这个软件',
      subtitle: '就绪',
      contextIcon: '↶',
      stateIcon: '✓',
      tone: 'ready',
    })
    expect(petDialogPresentation('thinking', '解释这段代码', 'zh-CN')).toMatchObject({
      title: '解释这段代码',
      subtitle: '正在生成回复…',
      contextIcon: '↶',
      tone: 'active',
    })
    expect(petDialogPresentation('error', undefined, 'zh-CN')).toMatchObject({ title: '任务遇到问题', tone: 'error' })
  })

  it('maps Harness states to stable body-action atlas rows', () => {
    expect([
      'idle',
      'thinking',
      'working',
      'searching',
      'bash',
      'editing',
      'waiting',
      'success',
      'error',
    ].map((status) => animationFrame(status as Parameters<typeof animationFrame>[0], 0, true).row))
      .toEqual([0, 7, 7, 8, 7, 7, 6, 4, 5])

    expect(animationFrame('idle', 920, false)).toEqual({ row: 0, column: 5 })
    expect(animationFrame('working', 480, false)).toEqual({ row: 7, column: 4 })
    expect(animationFrame('searching', 360, true)).toEqual({ row: 8, column: 0 })
    expect(animationFrame('thinking', 600, false)).toEqual({ row: 7, column: 5 })
    expect(animationFrame('success', 440, false)).toEqual({ row: 4, column: 3 })
    expect(animationFrame('error', 560, false)).toEqual({ row: 5, column: 4 })
  })

  it('uses a bounded wave on click and directional rows while dragging', () => {
    expect(animationFrame('idle', 1_000, false, 660)).toEqual({ row: 3, column: 2 })
    expect(animationFrame('idle', 2_000, false, 660)).toEqual({ row: 3, column: 3 })
    expect(animationFrame('idle', 480, false, undefined, 1)).toEqual({ row: 1, column: 4 })
    expect(animationFrame('idle', 480, false, undefined, -1)).toEqual({ row: 2, column: 4 })
    expect(animationFrame('idle', 480, true, undefined, 1)).toEqual({ row: 1, column: 0 })
    expect(animationFrame('idle', 1_000, true, 660)).toEqual({ row: 3, column: 0 })
  })

  it('faces the most recent horizontal drag direction', () => {
    expect(facingFromMovement(1, -12)).toBe(-1)
    expect(facingFromMovement(-1, 8)).toBe(1)
    expect(facingFromMovement(-1, 0.5)).toBe(-1)
  })

  it('keeps an independently dragged settings panel inside the viewport', () => {
    expect(clampFloatingPosition(
      { x: -40, y: 900 },
      { width: 310, height: 430 },
      { width: 1_000, height: 700 },
    )).toEqual({ x: 12, y: 258 })
    expect(clampFloatingPosition(
      { x: 80, y: 90 },
      { width: 500, height: 800 },
      { width: 400, height: 600 },
    )).toEqual({ x: 12, y: 12 })
  })

  it('follows the tail only when a streamed reply grows cumulatively', () => {
    expect(shouldFollowAssistantTail('第一段', '第一段\n第二段')).toBe(true)
    expect(shouldFollowAssistantTail(undefined, '第一段')).toBe(false)
    expect(shouldFollowAssistantTail('旧回答', '完全不同的新回答')).toBe(false)
    expect(shouldFollowAssistantTail('完整回答', '完整')).toBe(false)
  })
})
