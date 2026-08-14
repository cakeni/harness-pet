import type { PetStatus } from '../status.js'

export interface SnapshotSource<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** The only Harness-shaped value consumed by the state mapper. */
export interface SignalSnapshot {
  sessionId?: unknown
  chat?: unknown
  partial?: unknown
  running?: unknown
  runningCalls?: unknown
  pending?: unknown
  queue?: unknown
  promptError?: unknown
  lastAgentError?: unknown
  nodes?: unknown
  connection?: unknown
  derivedSuccess?: unknown
  [key: string]: unknown
}

interface HarnessSessions {
  list: SnapshotSource<{ current?: string }>
  binding(id: string): { session: HarnessSessionFace } | undefined
}

export interface FollowupSendResult {
  ok: boolean
  message?: string
}

export interface HarnessSessionFace extends SnapshotSource<SignalSnapshot> {
  prompt?(
    content: Array<{ type: 'text'; text: string }>,
    mode: 'queue' | 'steer',
  ): Promise<unknown>
}

export interface HarnessContext {
  sessions: HarnessSessions
  connection: {
    hostDescription: SnapshotSource<unknown>
  }
}

const TOOL_NAMES: Readonly<Record<'searching' | 'bash' | 'editing', ReadonlySet<string>>> = {
  searching: new Set(['web_search', 'tool_web', 'web']),
  bash: new Set(['bash', 'tool_bash', 'pwsh', 'tool_pwsh', 'powershell', 'shell']),
  editing: new Set([
    'str-replace-editor',
    'str_replace_editor',
    'tool_str_replace_editor',
    'apply_patch',
    'write_file',
    'write-file',
    'file_write',
  ]),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : []
}

function legacySlice(snapshot: SignalSnapshot): Record<string, unknown> | undefined {
  if (!isRecord(snapshot.chat) || !isRecord(snapshot.chat.legacy)) return undefined
  return snapshot.chat.legacy
}

function snapshotArray(snapshot: SignalSnapshot, key: 'nodes' | 'runningCalls'): readonly unknown[] {
  return Array.isArray(snapshot[key]) ? snapshot[key] : array(legacySlice(snapshot)?.[key])
}

function snapshotPartial(snapshot: SignalSnapshot): Record<string, unknown> | undefined {
  if ('partial' in snapshot) return isRecord(snapshot.partial) ? snapshot.partial : undefined
  const legacy = legacySlice(snapshot)?.partial
  return isRecord(legacy) ? legacy : undefined
}

function contentText(value: unknown): string | undefined {
  const text = array(value)
    .flatMap((block) => {
      if (!isRecord(block)) return []
      if (block.type !== 'text' && block.kind !== 'text') return []
      return typeof block.text === 'string' ? [block.text.trim()] : []
    })
    .filter(Boolean)
    .join(' ')
  return text || undefined
}

function runningToolNames(snapshot: SignalSnapshot): Set<string> {
  const names = new Set<string>()
  for (const call of snapshotArray(snapshot, 'runningCalls')) {
    if (!isRecord(call) || typeof call.name !== 'string') continue
    names.add(call.name.trim().toLowerCase())
  }
  return names
}

function hasError(snapshot: SignalSnapshot): boolean {
  const lastNode = snapshotArray(snapshot, 'nodes').at(-1)
  return (
    isRecord(snapshot.promptError) ||
    (typeof snapshot.lastAgentError === 'string' && snapshot.lastAgentError.trim().length > 0) ||
    snapshot.connection === 'reconnecting' ||
    (isRecord(lastNode) && lastNode.kind === 'turn-error')
  )
}

/** Pure Harness signal mapper. Unknown and malformed fields degrade safely. */
export function detectPetStatus(snapshot: SignalSnapshot): PetStatus {
  if (hasError(snapshot)) return 'error'
  if (snapshot.derivedSuccess === true) return 'success'

  if (
    array(snapshot.pending).length > 0 ||
    array(snapshot.queue).some((item) => isRecord(item) && item.placement === 'queued')
  ) {
    return 'waiting'
  }

  const names = runningToolNames(snapshot)
  for (const status of ['searching', 'bash', 'editing'] as const) {
    if ([...names].some((name) => TOOL_NAMES[status].has(name))) return status
  }

  if (snapshot.running === true || snapshotArray(snapshot, 'runningCalls').length > 0) return 'working'
  if (snapshotPartial(snapshot) !== undefined) return 'thinking'
  return 'idle'
}

/** Exact native running bit used by the generic success state machine. */
export function isHarnessRunning(snapshot: SignalSnapshot): boolean {
  return snapshot.running === true
}

export function harnessSignalIdentity(snapshot: SignalSnapshot): string | undefined {
  return typeof snapshot.sessionId === 'string' ? snapshot.sessionId : undefined
}

/** Latest local user message for the pet card. Never persisted or transmitted. */
export function harnessConversationTitle(snapshot: SignalSnapshot): string | undefined {
  for (const node of [...snapshotArray(snapshot, 'nodes')].reverse()) {
    if (!isRecord(node) || (node.kind !== 'user' && node.kind !== 'steering')) continue
    const text = contentText(node.content)
    if (text !== undefined) return text
  }

  for (const item of [...array(snapshot.queue)].reverse()) {
    if (!isRecord(item)) continue
    if (typeof item.text === 'string' && item.text.trim()) return item.text.trim()
    if (typeof item.preview === 'string' && item.preview.trim()) return item.preview.trim()
  }
  return undefined
}

/** Live partial answer, or the finalized answer that belongs to the latest user message. */
export function harnessAssistantText(snapshot: SignalSnapshot): string | undefined {
  const livePartial = snapshotPartial(snapshot)
  if (livePartial !== undefined) {
    const partial = contentText(livePartial.blocks)
    if (partial !== undefined) return partial
  }

  for (const node of [...snapshotArray(snapshot, 'nodes')].reverse()) {
    if (!isRecord(node)) continue
    if (node.kind === 'user' || node.kind === 'steering') return undefined
    if (node.kind === 'assistant') return contentText(node.blocks)
  }
  return undefined
}

function promptFailureMessage(result: unknown): string {
  if (!isRecord(result) || !isRecord(result.error)) return 'Harness 未确认发送结果'
  return typeof result.error.message === 'string' && result.error.message.trim()
    ? result.error.message.trim()
    : 'Harness 拒绝了这条消息'
}

/** Send through the current official SessionFace; no direct fetch or third-party endpoint. */
export async function sendHarnessFollowup(
  context: HarnessContext,
  value: string,
): Promise<FollowupSendResult> {
  const text = value.trim()
  if (!text) return { ok: false, message: '请输入继续跟进的内容' }
  const id = context.sessions.list.getSnapshot().current
  const session = id === undefined ? undefined : context.sessions.binding(id)?.session
  if (session?.prompt === undefined) return { ok: false, message: '当前没有可发送的 Harness 会话' }

  try {
    const result = await session.prompt([{ type: 'text', text }], 'queue')
    return isRecord(result) && result.ok === true
      ? { ok: true }
      : { ok: false, message: promptFailureMessage(result) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message ? error.message : '发送到 Harness 失败',
    }
  }
}

/**
 * Subscribe to the current SessionFace and the public connection description.
 * A description disappearing after the first successful connection is the
 * public structured reconnect signal; connection.start() remains host-owned.
 */
export function observeHarnessSignals(
  context: HarnessContext,
  listener: (snapshot: SignalSnapshot) => void,
): () => void {
  let disposed = false
  let currentSessionId: string | undefined
  let currentSource: SnapshotSource<SignalSnapshot> | undefined
  let unsubscribeCurrent: (() => void) | undefined
  let everConnected = context.connection.hostDescription.getSnapshot() !== undefined

  const connectionState = (): 'connected' | 'reconnecting' | undefined => {
    if (context.connection.hostDescription.getSnapshot() !== undefined) {
      everConnected = true
      return 'connected'
    }
    return everConnected ? 'reconnecting' : undefined
  }

  const emit = (): void => {
    if (disposed) return
    const current = currentSource?.getSnapshot()
    listener({
      ...(isRecord(current) ? current : {}),
      sessionId: currentSessionId,
      connection: connectionState(),
    })
  }

  const bindCurrent = (): void => {
    const id = context.sessions.list.getSnapshot().current
    const next = id === undefined ? undefined : context.sessions.binding(id)?.session
    currentSessionId = id
    if (Object.is(next, currentSource)) {
      emit()
      return
    }
    unsubscribeCurrent?.()
    currentSource = next
    unsubscribeCurrent = next?.subscribe(emit)
    emit()
  }

  const unsubscribeList = context.sessions.list.subscribe(bindCurrent)
  const unsubscribeConnection = context.connection.hostDescription.subscribe(emit)
  bindCurrent()

  return () => {
    if (disposed) return
    disposed = true
    unsubscribeCurrent?.()
    unsubscribeList()
    unsubscribeConnection()
    currentSource = undefined
  }
}
