import petAnimationBase64 from '../../assets/whale/whale-animation-v6.webp'
import { uiCopy, type UiLanguage } from '../i18n.js'
import { createSettingsPanel } from '../settings/index.js'
import { PET_STATUSES, type PetStatus } from '../status.js'
import { loadSettings, saveSettings, type WhaleSettings } from '../storage/index.js'
import { createDesktopWindowController } from './desktop-window.js'

export interface WhalePet {
  setStatus(status: PetStatus, conversationTitle?: string, assistantText?: string, conversationIdentity?: string): void
  dispose(): void
}

export interface PetActionResult {
  ok: boolean
  message?: string
}

export interface WhalePetOptions {
  onFollowup?(text: string): Promise<PetActionResult>
}

const STYLE = `
#harness-pet-root { position: fixed; inset: 0; z-index: 700; pointer-events: none; font: 13px/1.4 system-ui, sans-serif; color: #18364a; }
#harness-pet-root * { box-sizing: border-box; }
.hw-pet { position: fixed; margin: 0; padding: 0; border: 0; border-radius: 42%; background: transparent; cursor: grab; pointer-events: auto; touch-action: none; filter: drop-shadow(0 8px 12px rgba(14, 64, 91, .18)); }
.hw-pet:active { cursor: grabbing; }
.hw-pet:focus-visible { outline: none; filter: drop-shadow(0 8px 12px rgba(14, 64, 91, .18)) drop-shadow(0 0 2px #2c95c5); }
.hw-gear:focus-visible, .hw-button:focus-visible, .hw-dialog-action:focus-visible, .hw-dialog-close:focus-visible, .hw-panel input:focus-visible, .hw-panel select:focus-visible { outline: 2px solid #2c95c5; outline-offset: 2px; }
.hw-pet canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
.hw-dialog { --hw-tail-x: 75%; position: fixed; z-index: 701; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 14px; width: min(430px, calc(100vw - 24px)); min-height: 78px; padding: 13px 14px 13px 18px; border: 1px solid rgba(30, 67, 86, .1); border-radius: 24px; background: rgba(255, 255, 255, .98); box-shadow: 0 10px 30px rgba(17, 48, 65, .18); color: #182f3d; pointer-events: none; }
.hw-dialog[hidden] { display: none; }
.hw-dialog::after { content: ''; position: absolute; left: var(--hw-tail-x); bottom: -8px; width: 16px; height: 16px; border-right: 1px solid rgba(30, 67, 86, .1); border-bottom: 1px solid rgba(30, 67, 86, .1); background: #fff; transform: translateX(-50%) rotate(45deg); }
.hw-dialog-copy { min-width: 0; }
.hw-dialog-title { overflow: hidden; color: #142833; font-size: 16px; font-weight: 700; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.hw-dialog-subtitle { margin-top: 3px; overflow: hidden; color: #758791; font-size: 13px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.hw-dialog-response { display: block; max-height: 72px; margin-top: 8px; overflow: auto; padding: 7px 9px; border-radius: 10px; background: #f1f7fa; color: #31505f; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; pointer-events: auto; scrollbar-width: thin; white-space: pre-wrap; }
.hw-dialog-response[hidden] { display: none; }
.hw-dialog-close { position: absolute; z-index: 3; top: -9px; right: -9px; display: grid; place-items: center; width: 28px; height: 28px; padding: 0 0 2px; border: 1px solid #bed5df; border-radius: 50%; background: #fff; color: #386277; box-shadow: 0 3px 10px rgba(17, 48, 65, .16); cursor: pointer; pointer-events: auto; font: 500 21px/1 system-ui, sans-serif; }
.hw-dialog-close:hover { background: #edf7fb; color: #174e68; }
.hw-dialog-marks { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }
.hw-dialog-mark { display: grid; place-items: center; width: 42px; height: 42px; padding: 0; border: 0; border-radius: 50%; background: #e8ecee; color: #68757c; font: 800 21px/1 system-ui, sans-serif; }
.hw-dialog-mark:last-child { background: #d8f7e4; color: #08b95b; }
.hw-dialog-action { cursor: pointer; pointer-events: auto; transition: transform 160ms ease, background 160ms ease; }
.hw-dialog-action:hover { background: #dce1e4; }
.hw-dialog[data-followup='open'] .hw-dialog-action { background: #d7dde0; transform: rotate(-22deg); }
.hw-dialog[data-tone='active'] .hw-dialog-mark:last-child { background: #dff3ff; color: #238bb9; }
.hw-dialog[data-tone='waiting'] .hw-dialog-mark:last-child { background: #fff0c7; color: #ae7510; }
.hw-dialog[data-tone='error'] .hw-dialog-mark:last-child { background: #ffe0e4; color: #c43f50; }
.hw-dialog[data-placement='below']::after { top: -8px; bottom: auto; transform: translateX(-50%) rotate(225deg); }
.hw-followup { grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; min-width: 0; height: 42px; padding: 4px 5px 4px 14px; border: 1px solid #d9dfe2; border-radius: 999px; background: #fff; color: #65747c; pointer-events: auto; }
.hw-followup[hidden] { display: none; }
.hw-followup-input { min-width: 0; flex: 1; padding: 0; border: 0; outline: 0; background: transparent; color: #263d49; font: 600 13px/1.3 system-ui, sans-serif; }
.hw-followup-input::placeholder { color: #7c8990; opacity: 1; }
.hw-followup-submit { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; padding: 0; border: 0; border-radius: 50%; background: #d8f7e4; color: #08a956; cursor: pointer; font: 800 18px/1 system-ui, sans-serif; }
.hw-followup-submit:disabled { cursor: wait; opacity: .55; }
.hw-followup-error { grid-column: 1 / -1; margin: -8px 10px 0; color: #bd4050; font-size: 11px; line-height: 1.25; }
.hw-followup-error[hidden] { display: none; }
.hw-pet-label { position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%); padding: 2px 7px; border-radius: 999px; color: #fff; background: rgba(20, 65, 87, .78); font-size: 10px; letter-spacing: .02em; white-space: nowrap; }
.hw-gear { position: fixed; width: 30px; height: 30px; padding: 0; border: 1px solid rgba(53, 124, 153, .25); border-radius: 50%; background: rgba(255, 255, 255, .92); color: #256884; box-shadow: 0 3px 10px rgba(14, 64, 91, .16); cursor: pointer; pointer-events: auto; }
.hw-panel { position: fixed; width: min(310px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow-y: auto; padding: 14px; border: 1px solid rgba(53, 124, 153, .22); border-radius: 16px; background: rgba(249, 253, 255, .98); box-shadow: 0 14px 38px rgba(14, 45, 62, .24); pointer-events: auto; backdrop-filter: blur(12px); }
.hw-panel[hidden] { display: none; }
.hw-panel-header { display: flex; align-items: center; justify-content: space-between; margin: -6px -6px 8px; padding: 6px; border-radius: 10px; cursor: move; touch-action: none; user-select: none; font-size: 15px; }
.hw-panel-header:hover { background: rgba(44, 149, 197, .08); }
.hw-panel-header strong { pointer-events: none; }
.hw-close { width: 28px; height: 28px; padding: 0; font-size: 20px; line-height: 1; }
.hw-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 34px; }
.hw-row > span:first-child { color: #315266; }
.hw-range { display: inline-flex; align-items: center; gap: 7px; width: 155px; }
.hw-range input { min-width: 0; width: 110px; accent-color: #2c95c5; }
.hw-range output { width: 40px; color: #537184; text-align: right; font-size: 11px; }
.hw-panel select { max-width: 155px; padding: 4px 7px; border: 1px solid #b8d2de; border-radius: 7px; background: #fff; color: #18364a; }
.hw-panel input[type='checkbox'] { width: 16px; height: 16px; accent-color: #2c95c5; }
.hw-button { padding: 6px 10px; border: 1px solid #b8d2de; border-radius: 8px; background: #fff; color: #245a73; cursor: pointer; }
.hw-panel > .hw-button { width: 100%; margin-top: 8px; }
.hw-desktop-hint { margin: 6px 2px 0; color: #647b88; font-size: 10px; line-height: 1.35; }
.hw-desktop-message { display: block; margin-top: 6px; color: #bd4050; font-size: 11px; line-height: 1.3; }
.hw-desktop-message[hidden] { display: none; }
.hw-status-badge { padding: 2px 8px; border-radius: 999px; color: #fff; background: #397b9a; font-size: 11px; }
.hw-status-badge[data-status='error'] { background: #c84b5a; }
.hw-status-badge[data-status='success'] { background: #2c9568; }
.hw-panel footer { margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(53, 124, 153, .14); color: #6b7e88; font-size: 10px; }
`

const PET_ANIMATION_URL = `data:image/webp;base64,${petAnimationBase64}`
const ATLAS_COLUMNS = 8
const ATLAS_ROWS = 9
const PROGRESS_STATUSES = new Set<PetStatus>(['thinking', 'working', 'searching', 'bash', 'editing', 'waiting'])
const STATUS_ATLAS_ROW: Record<PetStatus, number> = {
  idle: 0,
  thinking: 7,
  working: 7,
  searching: 8,
  bash: 7,
  editing: 7,
  waiting: 6,
  success: 4,
  error: 5,
}
const ATLAS_ROW_DURATIONS: Readonly<Record<number, readonly number[]>> = {
  0: [280, 110, 110, 140, 140, 320],
  1: [120, 120, 120, 120, 120, 120, 120, 220],
  2: [120, 120, 120, 120, 120, 120, 120, 220],
  3: [140, 140, 140, 280],
  4: [140, 140, 140, 140, 280],
  5: [140, 140, 140, 140, 140, 140, 140, 240],
  6: [150, 150, 150, 150, 150, 260],
  7: [120, 120, 120, 120, 120, 220],
  8: [150, 150, 150, 150, 150, 280],
}

export interface PetDialogPresentation {
  title: string
  subtitle: string
  contextIcon: string
  stateIcon: string
  tone: 'ready' | 'active' | 'waiting' | 'error'
}

export type PetFacing = -1 | 1

export interface FloatingPosition {
  x: number
  y: number
}

export function clampFloatingPosition(
  position: FloatingPosition,
  panel: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 12,
): FloatingPosition {
  return {
    x: clamp(position.x, margin, viewport.width - panel.width - margin),
    y: clamp(position.y, margin, viewport.height - panel.height - margin),
  }
}

export function shouldFollowAssistantTail(previous: string | undefined, next: string | undefined): boolean {
  if (previous === undefined || next === undefined || next.length <= previous.length) return false
  return next.startsWith(previous)
}

export function facingFromMovement(current: PetFacing, deltaX: number): PetFacing {
  if (Math.abs(deltaX) < 1) return current
  return deltaX < 0 ? -1 : 1
}

export function hasProgressBubble(status: PetStatus): boolean {
  return PROGRESS_STATUSES.has(status)
}

export function progressLabel(status: PetStatus, language: UiLanguage = 'en-US'): string | undefined {
  const copy = uiCopy(language)
  if (status === 'thinking') return copy.replying
  if (status === 'waiting') return copy.waitingForYou
  if (hasProgressBubble(status)) return copy.processing
  return undefined
}

export function petDialogPresentation(
  status: PetStatus,
  conversationTitle?: string,
  language: UiLanguage = 'en-US',
): PetDialogPresentation {
  const statusCopy = uiCopy(language).statuses[status]
  const stateIcon = status === 'error' ? '!' : status === 'waiting' ? '?' : status === 'success' || status === 'idle' ? '✓' : '•••'
  const tone = status === 'error' ? 'error' : status === 'waiting' ? 'waiting' : status === 'idle' || status === 'success' ? 'ready' : 'active'
  return {
    title: conversationTitle?.trim() || statusCopy.title,
    subtitle: statusCopy.subtitle,
    contextIcon: '↶',
    stateIcon,
    tone,
  }
}

export function animationFrame(
  status: PetStatus,
  time: number,
  reduced: boolean,
  interactionStartedAt?: number,
  dragDirection?: PetFacing,
): { row: number; column: number } {
  if (dragDirection !== undefined) {
    const row = dragDirection === 1 ? 1 : 2
    return { row, column: reduced ? 0 : frameColumn(time, ATLAS_ROW_DURATIONS[row] ?? [120]) }
  }
  if (interactionStartedAt !== undefined) {
    return {
      row: 3,
      column: reduced ? 0 : frameColumn(time - interactionStartedAt, ATLAS_ROW_DURATIONS[3] ?? [140], false),
    }
  }
  const row = STATUS_ATLAS_ROW[status]
  return {
    row,
    column: reduced ? 0 : frameColumn(time, ATLAS_ROW_DURATIONS[row] ?? [150]),
  }
}

function frameColumn(time: number, durations: readonly number[], loop = true): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  let remaining = loop
    ? ((time % total) + total) % total
    : Math.min(Math.max(time, 0), total)
  for (let index = 0; index < durations.length; index += 1) {
    const duration = durations[index] ?? 0
    if (remaining < duration) return index
    remaining -= duration
  }
  return Math.max(0, durations.length - 1)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function defaultPosition(size: number): { x: number; y: number } {
  return {
    x: Math.max(8, window.innerWidth - size - 24),
    y: Math.max(8, window.innerHeight - size - 132),
  }
}

function clampPosition(position: { x: number; y: number }, size: number): { x: number; y: number } {
  return {
    x: clamp(position.x, 8, window.innerWidth - size - 8),
    y: clamp(position.y, 104, window.innerHeight - size - 88),
  }
}

function drawFallbackWhale(context: CanvasRenderingContext2D, status: PetStatus): void {
  context.fillStyle = status === 'error' ? '#466176' : '#244f78'
  context.beginPath()
  context.moveTo(38, 88)
  context.lineTo(16, 74)
  context.lineTo(20, 91)
  context.lineTo(13, 105)
  context.lineTo(40, 98)
  context.closePath()
  context.fill()

  context.beginPath()
  context.ellipse(84, 91, 50, 27, -0.06, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#98bdd0'
  context.beginPath()
  context.ellipse(96, 101, 34, 12, -0.06, 0, Math.PI)
  context.fill()
  context.fillStyle = '#071d2b'
  context.fillRect(117, 82, 3, 3)
}

function drawWhale(
  context: CanvasRenderingContext2D,
  status: PetStatus,
  time: number,
  reduced: boolean,
  whaleImage?: HTMLImageElement,
  interactionStartedAt?: number,
  facing: PetFacing = 1,
  dragDirection?: PetFacing,
): void {
  context.setTransform(2, 0, 0, 2, 0, 0)
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, 160, 160)
  context.save()
  if (dragDirection === undefined && facing === 1) {
    context.translate(160, 0)
    context.scale(-1, 1)
  }

  if (whaleImage === undefined) drawFallbackWhale(context, status)
  else {
    const frame = animationFrame(status, time, reduced, interactionStartedAt, dragDirection)
    const cellWidth = whaleImage.naturalWidth / ATLAS_COLUMNS
    const cellHeight = whaleImage.naturalHeight / ATLAS_ROWS
    const destinationWidth = 160 * cellWidth / cellHeight
    context.drawImage(
      whaleImage,
      frame.column * cellWidth,
      frame.row * cellHeight,
      cellWidth,
      cellHeight,
      (160 - destinationWidth) / 2,
      0,
      destinationWidth,
      160,
    )
  }

  context.restore()
}

export function createWhalePet(options: WhalePetOptions = {}): WhalePet {
  let settings = loadSettings()
  let harnessStatus: PetStatus = 'idle'
  let shownStatus: PetStatus = 'idle'
  let position = clampPosition(settings.position ?? defaultPosition(settings.size), settings.size)
  let animationRequest: number | undefined
  let cycleTimer: ReturnType<typeof setInterval> | undefined
  let interactionTimer: ReturnType<typeof setTimeout> | undefined
  let longPressTimer: ReturnType<typeof setTimeout> | undefined
  let cycleIndex = 0
  let interactionStartedAt: number | undefined
  let interactionUntil = 0
  let conversationTitle: string | undefined
  let assistantReply: string | undefined
  let followAssistantTail = false
  let conversationIdentity: string | undefined
  let dialogDismissed = false
  let panelPosition: FloatingPosition | undefined
  let panelDrag: { pointerId: number; pointerX: number; pointerY: number; x: number; y: number } | undefined
  let facing: PetFacing = -1
  let followupOpen = false
  let sendingFollowup = false
  let disposed = false

  const root = document.createElement('div')
  root.id = 'harness-pet-root'
  const style = document.createElement('style')
  style.dataset.plugin = 'harness-pet'
  style.textContent = STYLE

  const pet = document.createElement('button')
  pet.type = 'button'
  pet.className = 'hw-pet'
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 320
  const petLabel = document.createElement('span')
  petLabel.className = 'hw-pet-label'
  pet.append(canvas, petLabel)

  const dialog = document.createElement('div')
  dialog.className = 'hw-dialog'
  const dialogCopy = document.createElement('div')
  dialogCopy.className = 'hw-dialog-copy'
  dialogCopy.setAttribute('role', 'status')
  dialogCopy.setAttribute('aria-live', 'polite')
  const dialogTitle = document.createElement('div')
  dialogTitle.className = 'hw-dialog-title'
  const dialogSubtitle = document.createElement('div')
  dialogSubtitle.className = 'hw-dialog-subtitle'
  const dialogResponse = document.createElement('div')
  dialogResponse.className = 'hw-dialog-response'
  dialogResponse.hidden = true
  dialogCopy.append(dialogTitle, dialogSubtitle, dialogResponse)
  const dialogClose = document.createElement('button')
  dialogClose.type = 'button'
  dialogClose.className = 'hw-dialog-close'
  dialogClose.textContent = '×'
  const dialogMarks = document.createElement('div')
  dialogMarks.className = 'hw-dialog-marks'
  const contextMark = document.createElement('button')
  contextMark.type = 'button'
  contextMark.className = 'hw-dialog-mark hw-dialog-action'
  contextMark.setAttribute('aria-expanded', 'false')
  const stateMark = document.createElement('span')
  stateMark.className = 'hw-dialog-mark'
  stateMark.setAttribute('aria-hidden', 'true')
  dialogMarks.append(contextMark, stateMark)
  dialog.append(dialogCopy, dialogMarks, dialogClose)
  const followup = document.createElement('form')
  followup.className = 'hw-followup'
  followup.hidden = true
  const followupInput = document.createElement('input')
  followupInput.className = 'hw-followup-input'
  followupInput.type = 'text'
  followupInput.autocomplete = 'off'
  followupInput.maxLength = 4_000
  const followupSubmit = document.createElement('button')
  followupSubmit.className = 'hw-followup-submit'
  followupSubmit.type = 'submit'
  followupSubmit.textContent = '↑'
  followup.append(followupInput, followupSubmit)
  const followupError = document.createElement('output')
  followupError.className = 'hw-followup-error'
  followupError.hidden = true
  followupError.setAttribute('role', 'alert')
  dialog.append(followup, followupError)

  const gear = document.createElement('button')
  gear.type = 'button'
  gear.className = 'hw-gear'
  gear.textContent = '⚙'

  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reduced = (): boolean => settings.reducedMotion || media.matches
  const context = canvas.getContext('2d')
  const whaleAnimation = new Image()
  whaleAnimation.decoding = 'async'
  whaleAnimation.src = PET_ANIMATION_URL
  whaleAnimation.addEventListener('load', () => render(performance.now()), { once: true })

  let updateDesktopPanel: ((open: boolean) => void) | undefined
  const desktopWindow = createDesktopWindowController({
    scope: window,
    root,
    style,
    getLanguage: () => settings.language,
    onStateChange: (open) => updateDesktopPanel?.(open),
  })

  const panel = createSettingsPanel({
    settings,
    onChange: (next) => {
      settings = next
      saveSettings(settings)
      applySettings()
    },
    onResetPosition: () => {
      settings = { ...settings, position: null }
      position = clampPosition(defaultPosition(settings.size), settings.size)
      panelPosition = undefined
      saveSettings(settings)
      panel.setSettings(settings)
      place()
    },
    onShowDialog: () => setDialogVisible(true),
    desktopWindowAvailable: desktopWindow.supported,
    onToggleDesktopWindow: async () => {
      const result = await desktopWindow.toggle()
      if (result.ok && desktopWindow.isOpen()) panel.setOpen(false)
      return result
    },
  })
  updateDesktopPanel = (open) => panel.setDesktopWindow(open)
  root.append(pet, dialog, gear, panel.element)
  document.head.append(style)
  document.body.append(root)

  function displayedStatus(): PetStatus {
    if (settings.autoCycle) return PET_STATUSES[cycleIndex % PET_STATUSES.length] ?? 'idle'
    return settings.debugState === 'auto' ? harnessStatus : settings.debugState
  }

  function render(time = 0): void {
    if (context !== null) {
      drawWhale(
        context,
        shownStatus,
        time,
        reduced(),
        whaleAnimation.complete && whaleAnimation.naturalWidth > 0 ? whaleAnimation : undefined,
        time < interactionUntil ? interactionStartedAt : undefined,
        facing,
        dragged ? facing : undefined,
      )
    }
  }

  function animate(time: number): void {
    render(time)
    animationRequest = requestAnimationFrame(animate)
  }

  function restartAnimation(): void {
    if (animationRequest !== undefined) cancelAnimationFrame(animationRequest)
    animationRequest = undefined
    if (reduced()) render()
    else animationRequest = requestAnimationFrame(animate)
  }

  function updateStatus(): void {
    shownStatus = displayedStatus()
    const copy = uiCopy(settings.language)
    root.dataset.status = shownStatus
    petLabel.textContent = copy.statuses[shownStatus].label
    const presentation = petDialogPresentation(shownStatus, conversationTitle, settings.language)
    dialog.dataset.tone = presentation.tone
    dialogTitle.textContent = presentation.title
    dialogTitle.title = presentation.title
    dialogSubtitle.textContent = presentation.subtitle
    const reply = assistantReply?.trim()
    dialogResponse.hidden = !reply
    dialogResponse.textContent = reply ?? ''
    dialogResponse.title = reply ?? ''
    dialog.dataset.response = reply ? 'visible' : 'hidden'
    contextMark.textContent = presentation.contextIcon
    stateMark.textContent = presentation.stateIcon
    panel.setStatus(shownStatus)
    if (reply && followAssistantTail) {
      queueMicrotask(() => {
        if (!disposed && dialogResponse.textContent === reply) dialogResponse.scrollTop = dialogResponse.scrollHeight
      })
    }
    followAssistantTail = false
    render()
    placeDialog()
  }

  function place(): void {
    position = clampPosition(position, settings.size)
    pet.style.left = `${position.x}px`
    pet.style.top = `${position.y}px`
    pet.style.width = `${settings.size}px`
    pet.style.height = `${settings.size}px`
    if (settings.enabled) {
      gear.style.left = `${position.x + settings.size - 28}px`
      gear.style.top = `${position.y + 2}px`
      gear.style.right = 'auto'
      gear.style.bottom = 'auto'
    } else {
      gear.style.left = 'auto'
      gear.style.top = 'auto'
      gear.style.right = '20px'
      gear.style.bottom = '96px'
    }
    placeDialog()
    placePanel()
  }

  function placeDialog(): void {
    if (dialog.hidden) return
    const width = dialog.offsetWidth || Math.min(430, Math.max(0, window.innerWidth - 24))
    const height = dialog.offsetHeight || 78
    const petCenter = position.x + settings.size / 2
    const x = clamp(petCenter - width / 2, 12, window.innerWidth - width - 12)
    const preferredAbove = position.y - height - 14
    const placedAbove = preferredAbove >= 12
    const y = placedAbove
      ? preferredAbove
      : clamp(position.y + settings.size + 14, 12, window.innerHeight - height - 12)
    dialog.dataset.placement = placedAbove ? 'above' : 'below'
    dialog.style.left = `${x}px`
    dialog.style.top = `${y}px`
    dialog.style.setProperty('--hw-tail-x', `${clamp(petCenter - x, 26, width - 26)}px`)
  }

  function placePanel(): void {
    if (!panel.isOpen()) return
    const width = panel.element.offsetWidth || 310
    const height = panel.element.offsetHeight || 430
    const preferredX = position.x > window.innerWidth / 2 ? position.x - width - 12 : position.x + settings.size + 12
    const placed = clampFloatingPosition(
      panelPosition ?? { x: preferredX, y: position.y + settings.size - height },
      { width, height },
      { width: window.innerWidth, height: window.innerHeight },
    )
    panel.element.style.left = `${placed.x}px`
    panel.element.style.top = `${placed.y}px`
    panelPosition = placed
  }

  function configureCycle(): void {
    if (cycleTimer !== undefined) clearInterval(cycleTimer)
    cycleTimer = undefined
    if (!settings.autoCycle) return
    cycleIndex = 0
    cycleTimer = setInterval(() => {
      cycleIndex = (cycleIndex + 1) % PET_STATUSES.length
      updateStatus()
    }, 1_800)
  }

  function applySettings(): void {
    position = clampPosition(position, settings.size)
    pet.hidden = !settings.enabled
    dialog.hidden = !settings.enabled || dialogDismissed
    pet.style.opacity = String(settings.opacity)
    dialog.style.opacity = String(settings.opacity)
    gear.style.opacity = String(Math.max(settings.opacity, 0.65))
    root.classList.toggle('hw-reduced', reduced())
    const copy = uiCopy(settings.language)
    root.lang = settings.language
    pet.setAttribute('aria-label', copy.petLabel)
    gear.setAttribute('aria-label', copy.openSettings)
    dialogClose.setAttribute('aria-label', copy.closeDialog)
    followupInput.placeholder = copy.followupPlaceholder
    followupInput.setAttribute('aria-label', copy.followupInputLabel)
    followupSubmit.setAttribute('aria-label', copy.sendFollowup)
    contextMark.setAttribute('aria-label', followupOpen ? copy.collapseFollowup : copy.expandFollowup)
    panel.setSettings(settings)
    configureCycle()
    updateStatus()
    place()
    restartAnimation()
  }

  function setDialogVisible(visible: boolean): void {
    dialogDismissed = !visible
    dialog.hidden = !settings.enabled || dialogDismissed
    panel.setDialogVisible(visible)
    if (!visible && followupOpen) setFollowupOpen(false)
    placeDialog()
  }

  const togglePanel = (): void => {
    panel.setOpen(!panel.isOpen())
    placePanel()
  }

  const setFollowupOpen = (open: boolean): void => {
    followupOpen = open
    followup.hidden = !open
    if (!open) followupError.hidden = true
    dialog.dataset.followup = open ? 'open' : 'closed'
    contextMark.setAttribute('aria-expanded', String(open))
    const copy = uiCopy(settings.language)
    contextMark.setAttribute('aria-label', open ? copy.collapseFollowup : copy.expandFollowup)
    placeDialog()
    if (open) queueMicrotask(() => followupInput.focus())
  }

  const setFollowupBusy = (busy: boolean): void => {
    sendingFollowup = busy
    followupInput.disabled = busy
    followupSubmit.disabled = busy
    followupSubmit.textContent = busy ? '…' : '↑'
    followup.setAttribute('aria-busy', String(busy))
  }

  const showFollowupError = (message: string): void => {
    followupError.textContent = message
    followupError.hidden = false
    placeDialog()
  }

  gear.addEventListener('click', togglePanel)
  pet.addEventListener('dblclick', togglePanel)
  contextMark.addEventListener('click', (event) => {
    setFollowupOpen(!followupOpen)
    if (event.detail > 0) contextMark.blur()
  })
  dialogClose.addEventListener('click', (event) => {
    event.stopPropagation()
    setDialogVisible(false)
  })
  const onPanelPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || (event.target as HTMLElement | null)?.closest('button')) return
    const bounds = panel.element.getBoundingClientRect()
    panelPosition = { x: bounds.left, y: bounds.top }
    panelDrag = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: bounds.left,
      y: bounds.top,
    }
    panel.dragHandle.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const onPanelPointerMove = (event: PointerEvent): void => {
    if (panelDrag?.pointerId !== event.pointerId) return
    const width = panel.element.offsetWidth || 310
    const height = panel.element.offsetHeight || 430
    panelPosition = clampFloatingPosition(
      {
        x: panelDrag.x + event.clientX - panelDrag.pointerX,
        y: panelDrag.y + event.clientY - panelDrag.pointerY,
      },
      { width, height },
      { width: window.innerWidth, height: window.innerHeight },
    )
    panel.element.style.left = `${panelPosition.x}px`
    panel.element.style.top = `${panelPosition.y}px`
  }
  const onPanelPointerUp = (event: PointerEvent): void => {
    if (panelDrag?.pointerId !== event.pointerId) return
    panelDrag = undefined
    if (panel.dragHandle.hasPointerCapture(event.pointerId)) panel.dragHandle.releasePointerCapture(event.pointerId)
  }
  panel.dragHandle.addEventListener('pointerdown', onPanelPointerDown)
  panel.dragHandle.addEventListener('pointermove', onPanelPointerMove)
  panel.dragHandle.addEventListener('pointerup', onPanelPointerUp)
  panel.dragHandle.addEventListener('pointercancel', onPanelPointerUp)
  followup.addEventListener('keydown', (event) => {
    event.stopPropagation()
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault()
      followup.requestSubmit()
      return
    }
    if (event.key === 'Escape' && !sendingFollowup) {
      event.preventDefault()
      setFollowupOpen(false)
      contextMark.focus()
    }
  })
  followup.addEventListener('submit', (event) => {
    event.preventDefault()
    if (sendingFollowup) return
    const text = followupInput.value.trim()
    if (!text) {
      showFollowupError(uiCopy(settings.language).enterFollowup)
      followupInput.focus()
      return
    }
    followupError.hidden = true
    setFollowupBusy(true)
    void (options.onFollowup?.(text) ?? Promise.resolve({ ok: false, message: uiCopy(settings.language).currentSessionUnavailable }))
      .then((result) => {
        if (disposed) return
        setFollowupBusy(false)
        if (!result.ok) {
          showFollowupError(result.message ?? uiCopy(settings.language).sendFailed)
          followupInput.focus()
          return
        }
        followupInput.value = ''
        setFollowupOpen(false)
      })
      .catch((error: unknown) => {
        if (disposed) return
        setFollowupBusy(false)
        showFollowupError(error instanceof Error && error.message ? error.message : uiCopy(settings.language).sendFailed)
        followupInput.focus()
      })
  })

  let dragStart: { pointerX: number; pointerY: number; lastPointerX: number; x: number; y: number } | undefined
  let dragged = false
  pet.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    dragged = false
    dragStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      lastPointerX: event.clientX,
      x: position.x,
      y: position.y,
    }
    longPressTimer = setTimeout(() => {
      longPressTimer = undefined
      if (!dragged) togglePanel()
    }, 550)
  })
  pet.addEventListener('pointermove', (event) => {
    if (dragStart === undefined) return
    const dx = event.clientX - dragStart.pointerX
    const dy = event.clientY - dragStart.pointerY
    const movementX = event.clientX - dragStart.lastPointerX
    dragStart.lastPointerX = event.clientX
    if (Math.hypot(dx, dy) > 4) {
      if (!dragged) pet.setPointerCapture(event.pointerId)
      dragged = true
      if (longPressTimer !== undefined) clearTimeout(longPressTimer)
      longPressTimer = undefined
    }
    if (!dragged) return
    const nextFacing = facingFromMovement(facing, movementX)
    if (nextFacing !== facing) {
      facing = nextFacing
      render(performance.now())
    }
    position = clampPosition({ x: dragStart.x + dx, y: dragStart.y + dy }, settings.size)
    place()
  })
  const finishDrag = (): void => {
    if (longPressTimer !== undefined) clearTimeout(longPressTimer)
    longPressTimer = undefined
    dragStart = undefined
    if (!dragged) return
    pet.blur()
    settings = { ...settings, position }
    saveSettings(settings)
    panel.setSettings(settings)
  }
  pet.addEventListener('pointerup', finishDrag)
  pet.addEventListener('pointercancel', finishDrag)
  pet.addEventListener('click', () => {
    if (dragged) {
      dragged = false
      return
    }
    interactionStartedAt = performance.now()
    interactionUntil = interactionStartedAt + 700
    render(interactionStartedAt)
    pet.blur()
    if (interactionTimer !== undefined) clearTimeout(interactionTimer)
    interactionTimer = setTimeout(() => {
      interactionUntil = 0
      interactionStartedAt = undefined
      render(performance.now())
    }, 700)
  })

  const onResize = (): void => {
    position = clampPosition(position, settings.size)
    place()
  }
  const onMotionChange = (): void => {
    root.classList.toggle('hw-reduced', reduced())
    restartAnimation()
  }
  window.addEventListener('resize', onResize)
  media.addEventListener('change', onMotionChange)
  applySettings()

  return {
    setStatus: (status, nextConversationTitle, nextAssistantText, nextConversationIdentity) => {
      if (nextConversationIdentity !== undefined && nextConversationIdentity !== conversationIdentity) {
        conversationIdentity = nextConversationIdentity
        setDialogVisible(true)
      }
      harnessStatus = status
      conversationTitle = nextConversationTitle?.trim() || conversationTitle
      const nextReply = nextAssistantText?.trim() || undefined
      followAssistantTail = shouldFollowAssistantTail(assistantReply, nextReply)
      assistantReply = nextReply
      updateStatus()
    },
    dispose: () => {
      disposed = true
      desktopWindow.dispose()
      if (animationRequest !== undefined) cancelAnimationFrame(animationRequest)
      if (cycleTimer !== undefined) clearInterval(cycleTimer)
      if (interactionTimer !== undefined) clearTimeout(interactionTimer)
      if (longPressTimer !== undefined) clearTimeout(longPressTimer)
      window.removeEventListener('resize', onResize)
      media.removeEventListener('change', onMotionChange)
      panel.dragHandle.removeEventListener('pointerdown', onPanelPointerDown)
      panel.dragHandle.removeEventListener('pointermove', onPanelPointerMove)
      panel.dragHandle.removeEventListener('pointerup', onPanelPointerUp)
      panel.dragHandle.removeEventListener('pointercancel', onPanelPointerUp)
      root.remove()
      style.remove()
    },
  }
}
