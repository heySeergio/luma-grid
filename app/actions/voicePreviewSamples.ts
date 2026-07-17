'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  ensureVoicePreviewSamplesCore,
  type EnsureVoicePreviewsResult,
} from '@/lib/voice/ensurePreviewSamples'

export type { EnsureVoicePreviewsResult }

/**
 * @deprecated Preferir POST /api/voice/ensure-previews para no bloquear otras Server Actions.
 * Se mantiene por compatibilidad; genera las 10 voces en el servidor.
 */
export async function ensureVoicePreviewSamples(): Promise<EnsureVoicePreviewsResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'No autorizado' }
  }

  return ensureVoicePreviewSamplesCore()
}
