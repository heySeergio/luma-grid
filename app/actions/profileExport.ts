'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'

/**
 * Exporta el tablero como JSON (respaldo / traslado manual).
 * No incluye datos de facturación ni historial de uso.
 */
export async function exportProfileBoardJson(profileId: string): Promise<
  | { ok: true; data: string; filename: string }
  | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
  })

  if (!profile) return { ok: false, error: 'Tablero no encontrado' }

  const symbolRows = await findManySymbolsByProfileId(profileId)
  const symbolsOrdered = [...symbolRows].sort((a, b) => {
    if (a.positionY !== b.positionY) return a.positionY - b.positionY
    return a.positionX - b.positionX
  })

  const safeName = profile.name
    .trim()
    .replace(/[^a-zA-Z0-9\-_.]+/g, '_')
    .slice(0, 48) || 'tablero'
  const filename = `luma-grid-${safeName}-${profile.id.slice(0, 8)}.json`

  const payload = {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      gender: profile.gender,
      gridRows: profile.gridRows,
      gridCols: profile.gridCols,
      isDemo: profile.isDemo,
    },
    symbols: symbolsOrdered.map((s) => ({
      id: s.id,
      gridId: s.gridId,
      label: s.label,
      normalizedLabel: s.normalizedLabel,
      emoji: s.emoji,
      imageUrl: s.imageUrl,
      category: s.category,
      posType: s.posType,
      posConfidence: s.posConfidence,
      manualGrammarOverride: s.manualGrammarOverride,
      lexemeId: s.lexemeId,
      positionX: s.positionX,
      positionY: s.positionY,
      color: s.color,
      hidden: s.hidden,
      state: s.state,
      opensKeyboard: s.opensKeyboard,
      wordVariants: s.wordVariants,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  }

  return { ok: true, data: JSON.stringify(payload, null, 2), filename }
}
