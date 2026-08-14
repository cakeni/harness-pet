import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type StorageLike } from '../src/storage/index.js'
import { acquireWhaleSingleton } from '../src/storage/singleton.js'

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('settings storage', () => {
  it('round-trips valid settings', () => {
    const storage = new MemoryStorage()
    const settings = { ...DEFAULT_SETTINGS, size: 144, opacity: 0.6, position: { x: 20, y: 30 } }

    saveSettings(settings, storage)

    expect(loadSettings(storage)).toEqual(settings)
  })

  it('falls back safely for corrupt JSON and invalid values', () => {
    const corrupt = new MemoryStorage()
    corrupt.setItem('harness-whale:settings', '{broken')
    expect(loadSettings(corrupt)).toEqual(DEFAULT_SETTINGS)

    const invalid = new MemoryStorage()
    invalid.setItem('harness-whale:settings', JSON.stringify({ size: -5, opacity: 7, position: { x: 'nope' } }))
    expect(loadSettings(invalid)).toEqual(DEFAULT_SETTINGS)
  })

  it('uses English for old or invalid language settings', () => {
    const oldSettings = new MemoryStorage()
    oldSettings.setItem('harness-whale:settings', JSON.stringify({ enabled: false }))
    expect(loadSettings(oldSettings).language).toBe('en-US')

    const invalidLanguage = new MemoryStorage()
    invalidLanguage.setItem('harness-whale:settings', JSON.stringify({ language: 'fr-FR' }))
    expect(loadSettings(invalidLanguage).language).toBe('en-US')
  })
})

describe('singleton guard', () => {
  it('creates one instance and disposes it after the final lease', () => {
    const scope = {}
    const dispose = vi.fn()
    const start = vi.fn(() => ({ dispose }))

    const first = acquireWhaleSingleton(scope, start)
    const second = acquireWhaleSingleton(scope, start)

    expect(start).toHaveBeenCalledTimes(1)
    expect(second.instance).toBe(first.instance)
    second.release()
    expect(dispose).not.toHaveBeenCalled()
    first.release()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
