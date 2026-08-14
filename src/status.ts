export const PET_STATUSES = [
  'idle',
  'thinking',
  'working',
  'searching',
  'bash',
  'editing',
  'waiting',
  'error',
  'success',
] as const

export type PetStatus = (typeof PET_STATUSES)[number]

export function isPetStatus(value: unknown): value is PetStatus {
  return typeof value === 'string' && (PET_STATUSES as readonly string[]).includes(value)
}
