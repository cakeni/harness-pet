const SINGLETON_KEY = Symbol.for('harness-whale.instance')

export interface DisposableWhale {
  dispose(): void
}

interface SingletonEntry<T extends DisposableWhale> {
  instance: T
  references: number
}

export interface SingletonLease<T extends DisposableWhale> {
  instance: T
  release(): void
}

export function acquireWhaleSingleton<T extends DisposableWhale>(
  scope: object,
  start: () => T,
): SingletonLease<T> {
  const records = scope as Record<PropertyKey, unknown>
  let entry = records[SINGLETON_KEY] as SingletonEntry<T> | undefined
  if (entry === undefined) {
    entry = { instance: start(), references: 0 }
    records[SINGLETON_KEY] = entry
  }
  entry.references += 1
  let released = false

  return {
    instance: entry.instance,
    release: () => {
      if (released) return
      released = true
      entry.references -= 1
      if (entry.references > 0 || records[SINGLETON_KEY] !== entry) return
      delete records[SINGLETON_KEY]
      entry.instance.dispose()
    },
  }
}
