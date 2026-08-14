import { describe, expect, it } from 'vitest'
import { apply } from '../src/index.js'

describe('host entry', () => {
  it('provides the no-op root apply required by the Cordis loader', () => {
    expect(apply()).toBeUndefined()
  })
})
