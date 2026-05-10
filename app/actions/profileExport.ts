'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFixedZoneCellsForProfile } from '@/lib/prisma/profileFixedZoneSql'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'
import { isKeyboardThemeEmpty, parseKeyboardTheme } from '@/lib/keyboard/theme'

const LUMA_BOARD_EXPORT_VERSION = 3 as const

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

  const compactSymbols = symbolsOrdered.map((s) => {
    const compact: Record<string, unknown> = {
      id: s.id,
      label: s.label,
      x: s.positionX,
      y: s.positionY,
    }
    if (s.gridId && s.gridId !== 'main') compact.g = s.gridId
    if (s.emoji) compact.e = s.emoji
    if (s.imageUrl) compact.img = s.imageUrl
    if (s.category && s.category !== 'other') compact.cat = s.category
    if (s.posType && s.posType !== 'other') compact.pos = s.posType
    if (typeof s.posConfidence === 'number') compact.posConf = s.posConfidence
    if (s.manualGrammarOverride) compact.mgo = true
    if (s.color && s.color !== '#6366f1') compact.c = s.color
    if (s.hidden) compact.h = true
    if (s.state && s.state !== 'visible') compact.st = s.state
    if (s.opensKeyboard) compact.k = true
    if ((s as { fixedCell?: boolean }).fixedCell) compact.f = true
    if (s.wordVariants !== null) compact.wv = s.wordVariants
    return compact
  })

  const compactProfile: Record<string, unknown> = {
    name: profile.name,
    gender: profile.gender,
    gridRows: profile.gridRows,
    gridCols: profile.gridCols,
  }
  if (keyboardTheme && !isKeyboardThemeEmpty(keyboardTheme)) {
    compactProfile.keyboardTheme = keyboardTheme
  }
  if (fixedZoneCells !== null) {
    compactProfile.fixedZoneCells = fixedZoneCells
  }

  const payload = {
    version: LUMA_BOARD_EXPORT_VERSION,
    profile: compactProfile,
    symbols: compactSymbols,
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
        symbolIds: symbolsUsed.map((entry) => entry.id),
        isPinned: p.isPinned,
        useCount: p.useCount,
      }
    }),
  }

  return { ok: true, data: JSON.stringify(payload, null, 2), filename }
}
