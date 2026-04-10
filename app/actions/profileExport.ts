'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFixedZoneCellsForProfile } from '@/lib/prisma/profileFixedZoneSql'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'
import { parseKeyboardTheme } from '@/lib/keyboard/theme'

const LUMA_BOARD_EXPORT_VERSION = 2 as const

/**
 * Exporta el tablero como archivo .luma (JSON).
 * Incluye grid, símbolos, tema del teclado del tablero y frases del perfil.
 * No incluye voz TTS, preferencias de cuenta ni datos de facturación.
 */
export async function exportProfileBoardJson(profileId: string): Promise<
  | { ok: true; data: string; filename: string }
  | { ok: false; error: string }
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'No autorizado' }

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id },
    select: {
      id: true,
      name: true,
      gender: true,
      gridRows: true,
      gridCols: true,
      isDemo: true,
      keyboardTheme: true,
    },
  })

  if (!profile) return { ok: false, error: 'Tablero no encontrado' }

  const fixedZoneCells = await readFixedZoneCellsForProfile(profileId, session.user.id)

  const [symbolRows, phraseRows] = await Promise.all([
    findManySymbolsByProfileId(profileId),
    prisma.phrase.findMany({
      where: { profileId },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const symbolsOrdered = [...symbolRows].sort((a, b) => {
    if (a.positionY !== b.positionY) return a.positionY - b.positionY
    return a.positionX - b.positionX
  })

  const safeName = profile.name
    .trim()
    .replace(/[^a-zA-Z0-9\-_.]+/g, '_')
    .slice(0, 48) || 'tablero'
  const filename = `luma-${safeName}-${profile.id.slice(0, 8)}.luma`

  const keyboardTheme = parseKeyboardTheme(profile.keyboardTheme)

  const payload = {
    version: LUMA_BOARD_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      gender: profile.gender,
      gridRows: profile.gridRows,
      gridCols: profile.gridCols,
      isDemo: profile.isDemo,
      keyboardTheme,
      fixedZoneCells: fixedZoneCells ?? null,
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
      fixedCell: Boolean((s as { fixedCell?: boolean }).fixedCell),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    phrases: phraseRows.map((p) => {
      let symbolsUsed: Array<{ id: string; label: string }> = []
      try {
        const raw = JSON.parse(p.symbolsUsed) as unknown
        if (Array.isArray(raw)) {
          symbolsUsed = raw.filter(
            (x): x is { id: string; label: string } =>
              Boolean(x && typeof x === 'object' && typeof (x as { id?: string }).id === 'string' && typeof (x as { label?: string }).label === 'string'),
          )
        }
      } catch {
        symbolsUsed = []
      }
      return {
        text: p.text,
        symbolsUsed,
        isPinned: p.isPinned,
        useCount: p.useCount,
      }
    }),
  }

  return { ok: true, data: JSON.stringify(payload, null, 2), filename }
}
