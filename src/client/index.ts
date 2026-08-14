import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import {
  detectPetStatus,
  harnessAssistantText,
  harnessConversationTitle,
  harnessSignalIdentity,
  isHarnessRunning,
  observeHarnessSignals,
  sendHarnessFollowup,
  type HarnessContext,
} from '../adapters/deepseek-harness.js'
import { createWhalePet, type WhalePet, type WhalePetOptions } from '../pet/index.js'
import { PetStateMachine } from '../state-machine.js'
import { acquireWhaleSingleton, type DisposableWhale } from '../storage/singleton.js'

export const inject = ['sessions', 'connection']

export function startHarnessWhale(
  context: HarnessContext,
  createPet: (options: WhalePetOptions) => WhalePet = createWhalePet,
): DisposableWhale {
  const pet = createPet({ onFollowup: (text) => sendHarnessFollowup(context, text) })
  const machine = new PetStateMachine()
  let successTimer: ReturnType<typeof setTimeout> | undefined
  let conversationTitle: string | undefined
  let assistantText: string | undefined
  let conversationIdentity: string | undefined

  const unsubscribe = observeHarnessSignals(context, (snapshot) => {
    const identity = harnessSignalIdentity(snapshot)
    if (identity !== conversationIdentity) {
      conversationIdentity = identity
      conversationTitle = undefined
      assistantText = undefined
    }
    conversationTitle = harnessConversationTitle(snapshot) ?? conversationTitle
    assistantText = harnessAssistantText(snapshot)
    const status = machine.update({
      status: detectPetStatus(snapshot),
      running: isHarnessRunning(snapshot),
      identity,
    })
    pet.setStatus(status, conversationTitle, assistantText, identity)
    if (successTimer !== undefined) clearTimeout(successTimer)
    successTimer = status === 'success'
      ? setTimeout(() => pet.setStatus(machine.tick(), conversationTitle, assistantText, conversationIdentity), 3_010)
      : undefined
  })

  return {
    dispose: () => {
      if (successTimer !== undefined) clearTimeout(successTimer)
      unsubscribe()
      pet.dispose()
    },
  }
}

export function apply(ctx: ClientContext): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  ctx.effect(() => {
    const lease = acquireWhaleSingleton(window, () => startHarnessWhale(ctx as unknown as HarnessContext))
    return lease.release
  }, 'harness-whale: client lifecycle')
}
