import { describe, expect, it } from 'vitest'
import { PetStateMachine } from '../src/state-machine.js'

describe('PetStateMachine', () => {
  it('derives success from a clean running true-to-false edge', () => {
    const machine = new PetStateMachine(3_000)

    expect(machine.update({ status: 'working', running: true }, 0)).toBe('working')
    expect(machine.update({ status: 'idle', running: false }, 100)).toBe('success')
    expect(machine.tick(3_099)).toBe('success')
    expect(machine.tick(3_100)).toBe('idle')
  })

  it('does not celebrate a run that reported an error', () => {
    const machine = new PetStateMachine()

    machine.update({ status: 'working', running: true }, 0)
    expect(machine.update({ status: 'error', running: true }, 10)).toBe('error')
    expect(machine.update({ status: 'idle', running: false }, 20)).toBe('idle')
  })

  it('keeps error above an active success window and resumes the latest state', () => {
    const machine = new PetStateMachine(3_000)

    machine.update({ status: 'working', running: true }, 0)
    expect(machine.update({ status: 'waiting', running: false }, 50)).toBe('success')
    expect(machine.update({ status: 'error', running: false }, 100)).toBe('error')
    expect(machine.update({ status: 'waiting', running: false }, 150)).toBe('waiting')
  })

  it('does not derive success when the current session changes', () => {
    const machine = new PetStateMachine()

    expect(machine.update({ status: 'working', running: true, identity: 'a' }, 0)).toBe('working')
    expect(machine.update({ status: 'idle', running: false, identity: 'b' }, 100)).toBe('idle')
  })
})
