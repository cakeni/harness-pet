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
})
