import type { PetStatus } from './status.js'

export interface PetObservation {
  status: PetStatus
  running: boolean
  identity?: unknown
}

/** Generic transition state; Harness field interpretation stays in the adapter. */
export class PetStateMachine {
  private identity: unknown = Symbol('unset')
  private baseStatus: PetStatus = 'idle'
  private wasRunning = false
  private runFailed = false
  private successUntil = 0

  constructor(private readonly successDurationMs = 3_000) {}

  update(observation: PetObservation, now = Date.now()): PetStatus {
    if (!Object.is(this.identity, observation.identity)) {
      this.identity = observation.identity
      this.wasRunning = false
      this.runFailed = false
      this.successUntil = 0
    }
    const ended = this.wasRunning && !observation.running
    this.baseStatus = observation.status

    if (observation.status === 'error') {
      this.runFailed ||= observation.running || this.wasRunning
      this.successUntil = 0
    }

    if (ended) {
      if (!this.runFailed && observation.status !== 'error') {
        this.successUntil = now + this.successDurationMs
      }
      this.runFailed = false
    }

    if (observation.running) {
      if (!this.wasRunning) this.runFailed = observation.status === 'error'
      this.successUntil = 0
    }

    this.wasRunning = observation.running
    return this.resolve(now)
  }

  tick(now = Date.now()): PetStatus {
    return this.resolve(now)
  }

  private resolve(now: number): PetStatus {
    if (this.baseStatus === 'error') return 'error'
    if (now < this.successUntil) return 'success'
    return this.baseStatus
  }
}
