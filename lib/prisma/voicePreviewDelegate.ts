import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const VOICE_PREVIEW_STALE_CLIENT_MSG =
  'Prisma Client desactualizado: cierra el servidor de desarrollo, ejecuta `npx prisma generate` en la carpeta del proyecto y vuelve a arrancar `npm run dev`.'

/** Si falta el modelo en runtime (cliente sin regenerar), devuelve null. */
export function getVoicePreviewSampleDelegate(): PrismaClient['voicePreviewSample'] | null {
  const raw = prisma as unknown as Record<string, unknown>
  const d = raw.voicePreviewSample
  if (d == null || typeof (d as { findUnique?: unknown }).findUnique !== 'function') {
    return null
  }
  return d as PrismaClient['voicePreviewSample']
}
