import { uiCopy, type UiLanguage } from '../i18n.js'

export interface DesktopWindowResult {
  ok: boolean
  message?: string
}

export interface DesktopWindowController {
  readonly supported: boolean
  isOpen(): boolean
  toggle(): Promise<DesktopWindowResult>
  dispose(): void
}

interface DocumentPictureInPictureApi {
  window: Window | null
  requestWindow(options: { width: number; height: number }): Promise<Window>
}

type DesktopCapableWindow = Window & {
  documentPictureInPicture?: DocumentPictureInPictureApi
}

const DESKTOP_STYLE = `
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
body { background: radial-gradient(circle at 50% 68%, rgba(231, 247, 253, .96), rgba(249, 253, 255, .96)); }
#harness-pet-root { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; }
.hw-pet { left: 50% !important; top: auto !important; right: auto !important; bottom: 12px !important; transform: translateX(-50%); }
.hw-dialog { left: 12px !important; top: 12px !important; right: 12px !important; bottom: auto !important; width: auto !important; transform: none !important; }
.hw-dialog::after { left: 50% !important; top: auto !important; bottom: -8px !important; transform: translateX(-50%) rotate(45deg) !important; }
.hw-gear { left: auto !important; top: auto !important; right: 10px !important; bottom: 10px !important; }
.hw-panel { left: 12px !important; top: 12px !important; right: 12px !important; bottom: 12px !important; width: auto !important; max-height: calc(100vh - 24px); overflow: auto; }
`

export function supportsDesktopPetWindow(scope: Window = window): boolean {
  const candidate = scope as DesktopCapableWindow
  return scope.isSecureContext && typeof candidate.documentPictureInPicture?.requestWindow === 'function'
}

export function createDesktopWindowController(options: {
  scope: Window
  root: HTMLElement
  style: HTMLStyleElement
  getLanguage?(): UiLanguage
  onStateChange(open: boolean): void
}): DesktopWindowController {
  const sourceDocument = options.scope.document
  const api = (options.scope as DesktopCapableWindow).documentPictureInPicture
  let desktopWindow: Window | undefined
  let desktopStyle: HTMLStyleElement | undefined

  const restore = (): void => {
    if (options.root.ownerDocument !== sourceDocument) sourceDocument.body.append(options.root)
    desktopStyle?.remove()
    desktopStyle = undefined
    if (desktopWindow !== undefined) options.onStateChange(false)
    desktopWindow = undefined
  }

  const close = (): void => {
    const current = desktopWindow
    if (current === undefined) return
    restore()
    current.close()
  }

  const open = async (): Promise<DesktopWindowResult> => {
    const language = options.getLanguage?.() ?? 'en-US'
    const copy = uiCopy(language)
    if (!supportsDesktopPetWindow(options.scope) || api === undefined) {
      return { ok: false, message: copy.desktopWindowUnsupportedMessage }
    }
    if (desktopWindow !== undefined && !desktopWindow.closed) return { ok: true }

    try {
      const next = await api.requestWindow({ width: 460, height: 340 })
      desktopWindow = next
      next.document.title = 'Harness Pet — Unofficial community project'
      next.document.documentElement.lang = language
      const viewport = next.document.createElement('meta')
      viewport.name = 'viewport'
      viewport.content = 'width=device-width, initial-scale=1'
      desktopStyle = next.document.createElement('style')
      desktopStyle.textContent = `${options.style.textContent ?? ''}\n${DESKTOP_STYLE}`
      next.document.head.append(viewport, desktopStyle)
      next.document.body.append(options.root)
      next.addEventListener('pagehide', restore, { once: true })
      options.onStateChange(true)
      return { ok: true }
    } catch (error) {
      restore()
      return {
        ok: false,
        message: error instanceof Error && error.message ? error.message : copy.desktopWindowOpenFailed,
      }
    }
  }

  return {
    supported: supportsDesktopPetWindow(options.scope),
    isOpen: () => desktopWindow !== undefined && !desktopWindow.closed,
    toggle: () => desktopWindow === undefined || desktopWindow.closed
      ? open()
      : Promise.resolve((close(), { ok: true })),
    dispose: close,
  }
}
