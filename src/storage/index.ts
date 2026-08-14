import { isPetStatus, type PetStatus } from '../status.js'
import { isUiLanguage, type UiLanguage } from '../i18n.js'

export const STORAGE_KEY = 'harness-pet:settings'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface WhaleSettings {
  language: UiLanguage
  enabled: boolean
  size: number
  opacity: number
  reducedMotion: boolean
  debugState: 'auto' | PetStatus
  autoCycle: boolean
  position: { x: number; y: number } | null
}

export const DEFAULT_SETTINGS: Readonly<WhaleSettings> = Object.freeze({
  language: 'en-US',
  enabled: true,
  size: 112,
  opacity: 0.95,
  reducedMotion: false,
  debugState: 'auto',
  autoCycle: false,
  position: null,
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function parseSettings(value: unknown): WhaleSettings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS }
  const position = isRecord(value.position) && validNumber(value.position.x, 0, Number.MAX_SAFE_INTEGER) && validNumber(value.position.y, 0, Number.MAX_SAFE_INTEGER)
    ? { x: value.position.x, y: value.position.y }
    : null

  return {
    language: isUiLanguage(value.language) ? value.language : DEFAULT_SETTINGS.language,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_SETTINGS.enabled,
    size: validNumber(value.size, 72, 160) ? value.size : DEFAULT_SETTINGS.size,
    opacity: validNumber(value.opacity, 0.3, 1) ? value.opacity : DEFAULT_SETTINGS.opacity,
    reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    debugState: value.debugState === 'auto' || isPetStatus(value.debugState) ? value.debugState : DEFAULT_SETTINGS.debugState,
    autoCycle: typeof value.autoCycle === 'boolean' ? value.autoCycle : DEFAULT_SETTINGS.autoCycle,
    position,
  }
}

function defaultStorage(): StorageLike {
  return window.localStorage
}

export function loadSettings(storage: StorageLike = defaultStorage()): WhaleSettings {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    return raw === null ? { ...DEFAULT_SETTINGS } : parseSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: WhaleSettings, storage: StorageLike = defaultStorage()): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}
