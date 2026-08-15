import { describe, expect, it, vi } from 'vitest'
import { createDesktopWindowController, supportsDesktopPetWindow } from '../src/pet/desktop-window.js'

describe('desktop pet window support', () => {
  it('requires both a secure context and Document Picture-in-Picture', () => {
    expect(supportsDesktopPetWindow({
      isSecureContext: true,
      documentPictureInPicture: { requestWindow: () => Promise.resolve({}) },
    } as unknown as Window)).toBe(true)
    expect(supportsDesktopPetWindow({
      isSecureContext: false,
      documentPictureInPicture: { requestWindow: () => Promise.resolve({}) },
    } as unknown as Window)).toBe(false)
    expect(supportsDesktopPetWindow({ isSecureContext: true } as Window)).toBe(false)
  })

  it('moves the existing root into the desktop document and restores it on close', async () => {
    const root = { ownerDocument: undefined as unknown }
    const appendTo = (document: unknown) => vi.fn((node: typeof root) => {
      node.ownerDocument = document
    })
    const sourceDocument: Record<string, unknown> = {
      documentElement: { lang: 'zh-CN' },
    }
    sourceDocument.body = { append: appendTo(sourceDocument) }
    const desktopDocument: Record<string, unknown> = {
      documentElement: { lang: '' },
      createElement: (tag: string) => ({ tag, name: '', content: '', textContent: '', remove: vi.fn() }),
      head: { append: vi.fn() },
    }
    desktopDocument.body = { append: appendTo(desktopDocument) }
    root.ownerDocument = sourceDocument
    let pageHide: (() => void) | undefined
    const desktopWindow = {
      closed: false,
      document: desktopDocument,
      addEventListener: vi.fn((_type: string, listener: () => void) => { pageHide = listener }),
      close: vi.fn(),
    }
    const onStateChange = vi.fn()
    const scope = {
      isSecureContext: true,
      document: sourceDocument,
      documentPictureInPicture: {
        window: null,
        requestWindow: vi.fn().mockResolvedValue(desktopWindow),
      },
    } as unknown as Window
    const controller = createDesktopWindowController({
      scope,
      root: root as unknown as HTMLElement,
      style: { textContent: '.pet {}' } as HTMLStyleElement,
      onStateChange,
    })

    await expect(controller.toggle()).resolves.toEqual({ ok: true })
    expect(root.ownerDocument).toBe(desktopDocument)
    expect(onStateChange).toHaveBeenLastCalledWith(true)
    expect(pageHide).toBeTypeOf('function')

    await expect(controller.toggle()).resolves.toEqual({ ok: true })
    expect(root.ownerDocument).toBe(sourceDocument)
    expect(desktopWindow.close).toHaveBeenCalledOnce()
    expect(onStateChange).toHaveBeenLastCalledWith(false)
  })

  it('treats Electron environments as unsupported (Document PiP not implemented)', () => {
    expect(supportsDesktopPetWindow({
      isSecureContext: true,
      navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Electron/43.4.0 Safari/537.36' },
      documentPictureInPicture: { requestWindow: () => Promise.resolve({}) },
    } as unknown as Window)).toBe(false)
  })

  it('maps the "Internal error: no window" rejection to friendly copy', async () => {
    const sourceDocument: Record<string, unknown> = { documentElement: { lang: 'en-US' } }
    sourceDocument.body = { append: vi.fn() }
    const root = { ownerDocument: sourceDocument }
    const scope = {
      isSecureContext: true,
      navigator: { userAgent: 'Mozilla/5.0 Chrome/120.0' },
      document: sourceDocument,
      documentPictureInPicture: {
        window: null,
        requestWindow: vi.fn().mockRejectedValue(new Error("Failed to execute 'requestWindow' on 'DocumentPictureInPicture': Internal error: no window")),
      },
    } as unknown as Window
    const controller = createDesktopWindowController({
      scope,
      root: root as unknown as HTMLElement,
      style: { textContent: '.pet {}' } as HTMLStyleElement,
      onStateChange: vi.fn(),
    })
    const result = await controller.toggle()
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Floating pet window is not available in this app: Electron does not implement Document Picture-in-Picture (electron/electron#39633)')
  })
})
