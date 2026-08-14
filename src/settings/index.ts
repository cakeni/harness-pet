import { PET_STATUSES, type PetStatus } from '../status.js'
import type { WhaleSettings } from '../storage/index.js'
import { UI_LANGUAGES, uiCopy } from '../i18n.js'

export interface SettingsPanel {
  readonly element: HTMLElement
  readonly dragHandle: HTMLElement
  isOpen(): boolean
  setOpen(open: boolean): void
  setSettings(settings: WhaleSettings): void
  setStatus(status: PetStatus): void
  setDialogVisible(visible: boolean): void
  setDesktopWindow(open: boolean, message?: string): void
}

export interface SettingsPanelOptions {
  settings: WhaleSettings
  onChange(settings: WhaleSettings): void
  onResetPosition(): void
  onShowDialog(): void
  desktopWindowAvailable: boolean
  onToggleDesktopWindow(): Promise<{ ok: boolean; message?: string }>
}

function button(text: string): HTMLButtonElement {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'hw-button'
  element.textContent = text
  return element
}

function row(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label')
  label.className = 'hw-row'
  const text = document.createElement('span')
  text.textContent = labelText
  label.append(text, control)
  return label
}

export function createSettingsPanel(options: SettingsPanelOptions): SettingsPanel {
  let settings = options.settings
  let currentStatus: PetStatus = 'idle'
  let desktopWindowOpen = false
  const element = document.createElement('section')
  element.className = 'hw-panel'
  element.hidden = true

  const header = document.createElement('header')
  header.className = 'hw-panel-header'
  const title = document.createElement('strong')
  title.textContent = 'Harness Pet'
  const close = button('×')
  close.classList.add('hw-close')
  header.append(title, close)

  const language = document.createElement('select')
  for (const value of UI_LANGUAGES) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = uiCopy(value).languageName
    language.append(option)
  }

  const enabled = document.createElement('input')
  enabled.type = 'checkbox'

  const size = document.createElement('input')
  size.type = 'range'
  size.min = '72'
  size.max = '160'
  size.step = '4'
  const sizeValue = document.createElement('output')
  const sizeControl = document.createElement('span')
  sizeControl.className = 'hw-range'
  sizeControl.append(size, sizeValue)

  const opacity = document.createElement('input')
  opacity.type = 'range'
  opacity.min = '0.3'
  opacity.max = '1'
  opacity.step = '0.05'
  const opacityValue = document.createElement('output')
  const opacityControl = document.createElement('span')
  opacityControl.className = 'hw-range'
  opacityControl.append(opacity, opacityValue)

  const reducedMotion = document.createElement('input')
  reducedMotion.type = 'checkbox'

  const debugState = document.createElement('select')
  for (const status of ['auto', ...PET_STATUSES] as const) {
    const option = document.createElement('option')
    option.value = status
    debugState.append(option)
  }

  const autoCycle = document.createElement('input')
  autoCycle.type = 'checkbox'

  const badge = document.createElement('span')
  badge.className = 'hw-status-badge'
  badge.setAttribute('aria-live', 'polite')

  const reset = button('')
  const showDialog = button('')
  showDialog.hidden = true
  const desktopWindow = button('')
  desktopWindow.disabled = !options.desktopWindowAvailable
  const desktopWindowHint = document.createElement('p')
  desktopWindowHint.className = 'hw-desktop-hint'
  const desktopWindowMessage = document.createElement('output')
  desktopWindowMessage.className = 'hw-desktop-message'
  desktopWindowMessage.hidden = true
  desktopWindowMessage.setAttribute('role', 'status')
  const footer = document.createElement('footer')

  const languageRow = row('', language)
  const enabledRow = row('', enabled)
  const sizeRow = row('', sizeControl)
  const opacityRow = row('', opacityControl)
  const reducedMotionRow = row('', reducedMotion)
  const debugStateRow = row('', debugState)
  const autoCycleRow = row('', autoCycle)
  const statusRow = row('', badge)

  element.append(
    header,
    languageRow,
    enabledRow,
    sizeRow,
    opacityRow,
    reducedMotionRow,
    debugStateRow,
    autoCycleRow,
    statusRow,
    reset,
    showDialog,
    desktopWindow,
    desktopWindowHint,
    desktopWindowMessage,
    footer,
  )

  const notify = (patch: Partial<WhaleSettings>): void => {
    settings = { ...settings, ...patch }
    options.onChange(settings)
  }

  language.addEventListener('change', () => notify({ language: language.value as WhaleSettings['language'] }))
  enabled.addEventListener('change', () => notify({ enabled: enabled.checked }))
  size.addEventListener('input', () => {
    sizeValue.textContent = `${size.value}px`
    notify({ size: Number(size.value) })
  })
  opacity.addEventListener('input', () => {
    opacityValue.textContent = `${Math.round(Number(opacity.value) * 100)}%`
    notify({ opacity: Number(opacity.value) })
  })
  reducedMotion.addEventListener('change', () => notify({ reducedMotion: reducedMotion.checked }))
  debugState.addEventListener('change', () => notify({ debugState: debugState.value as WhaleSettings['debugState'] }))
  autoCycle.addEventListener('change', () => notify({ autoCycle: autoCycle.checked }))
  reset.addEventListener('click', options.onResetPosition)
  showDialog.addEventListener('click', options.onShowDialog)
  desktopWindow.addEventListener('click', () => {
    desktopWindow.disabled = true
    desktopWindowMessage.hidden = true
    void options.onToggleDesktopWindow().then((result) => {
      desktopWindow.disabled = !options.desktopWindowAvailable
      if (!result.ok) {
        desktopWindowMessage.textContent = result.message ?? uiCopy(settings.language).desktopWindowFailed
        desktopWindowMessage.hidden = false
      }
    })
  })
  close.addEventListener('click', () => {
    element.hidden = true
  })

  const setRowText = (target: HTMLLabelElement, text: string): void => {
    const label = target.firstElementChild
    if (label !== null) label.textContent = text
  }

  const applyCopy = (): void => {
    const copy = uiCopy(settings.language)
    element.lang = settings.language
    element.setAttribute('aria-label', copy.settingsLabel)
    close.setAttribute('aria-label', copy.closeSettings)
    setRowText(languageRow, copy.language)
    setRowText(enabledRow, copy.enablePet)
    setRowText(sizeRow, copy.petSize)
    setRowText(opacityRow, copy.opacity)
    setRowText(reducedMotionRow, copy.reducedMotion)
    setRowText(debugStateRow, copy.debugState)
    setRowText(autoCycleRow, copy.autoCycle)
    setRowText(statusRow, copy.currentStatus)
    for (const option of [...debugState.options]) {
      option.textContent = option.value === 'auto'
        ? copy.followHarness
        : copy.statuses[option.value as PetStatus].label
    }
    badge.textContent = copy.statuses[currentStatus].label
    reset.textContent = copy.resetPosition
    showDialog.textContent = copy.showDialog
    desktopWindow.textContent = desktopWindowOpen
      ? copy.returnToHarness
      : options.desktopWindowAvailable ? copy.openDesktopWindow : copy.desktopWindowUnsupported
    desktopWindowHint.textContent = copy.desktopWindowHint
    footer.textContent = copy.disclaimer
  }

  const setSettings = (next: WhaleSettings): void => {
    settings = next
    language.value = next.language
    enabled.checked = next.enabled
    size.value = String(next.size)
    sizeValue.textContent = `${next.size}px`
    opacity.value = String(next.opacity)
    opacityValue.textContent = `${Math.round(next.opacity * 100)}%`
    reducedMotion.checked = next.reducedMotion
    debugState.value = next.debugState
    autoCycle.checked = next.autoCycle
    applyCopy()
  }
  setSettings(settings)

  return {
    element,
    dragHandle: header,
    isOpen: () => !element.hidden,
    setOpen: (open) => {
      element.hidden = !open
    },
    setSettings,
    setStatus: (status) => {
      currentStatus = status
      badge.textContent = uiCopy(settings.language).statuses[status].label
      badge.dataset.status = status
    },
    setDialogVisible: (visible) => {
      showDialog.hidden = visible
    },
    setDesktopWindow: (open, message) => {
      desktopWindowOpen = open
      const copy = uiCopy(settings.language)
      desktopWindow.textContent = open
        ? copy.returnToHarness
        : options.desktopWindowAvailable ? copy.openDesktopWindow : copy.desktopWindowUnsupported
      desktopWindow.disabled = !options.desktopWindowAvailable
      desktopWindowMessage.textContent = message ?? ''
      desktopWindowMessage.hidden = message === undefined
    },
  }
}
