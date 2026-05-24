import { prisma } from '@/lib/prisma'
import { isMissingDatabaseColumnError, isUnknownPrismaFieldError } from '@/lib/prisma/compat'

/** Campos escalares de Symbol para lecturas sin relaciones (evita columnas que aún no existen en BD). */
const SYMBOL_SELECT_CORE = {
  id: true,
  profileId: true,
  gridId: true,
  label: true,
  normalizedLabel: true,
  emoji: true,
  imageUrl: true,
  category: true,
  posType: true,
  posConfidence: true,
  manualGrammarOverride: true,
  lexemeId: true,
  positionX: true,
  positionY: true,
  color: true,
  hidden: true,
  state: true,
  createdAt: true,
  updatedAt: true,
} as const

const TAP_AUDIO_DEFAULTS = { tapAudioUrl: null as string | null, tapAudioMeta: null as unknown }

/**
 * Símbolos de un tablero con degradación si la BD aún no tiene columnas opcionales.
 */
export async function findManySymbolsByProfileId(profileId: string) {
  try {
    return await prisma.symbol.findMany({
      where: { profileId },
      select: {
        ...SYMBOL_SELECT_CORE,
        opensKeyboard: true,
        wordVariants: true,
        fixedCell: true,
        tapAudioUrl: true,
        tapAudioMeta: true,
      },
    })
  } catch (e1) {
    const w1 =
      isUnknownPrismaFieldError(e1, [
        'opensKeyboard',
        'wordVariants',
        'fixedCell',
        'tapAudioUrl',
        'tapAudioMeta',
      ]) ||
      isMissingDatabaseColumnError(e1, 'word_variants') ||
      isMissingDatabaseColumnError(e1, 'opens_keyboard') ||
      isMissingDatabaseColumnError(e1, 'fixed_cell') ||
      isMissingDatabaseColumnError(e1, 'tap_audio_url') ||
      isMissingDatabaseColumnError(e1, 'tap_audio_meta')

    if (!w1) throw e1

    try {
      const rows = await prisma.symbol.findMany({
        where: { profileId },
        select: {
          ...SYMBOL_SELECT_CORE,
          opensKeyboard: true,
          wordVariants: true,
          fixedCell: true,
        },
      })
      return rows.map((r) => ({ ...r, ...TAP_AUDIO_DEFAULTS }))
    } catch (e2) {
      const w2 =
        isUnknownPrismaFieldError(e2, ['opensKeyboard', 'wordVariants', 'fixedCell']) ||
        isMissingDatabaseColumnError(e2, 'word_variants') ||
        isMissingDatabaseColumnError(e2, 'opens_keyboard') ||
        isMissingDatabaseColumnError(e2, 'fixed_cell')

      if (!w2) throw e2

      try {
        const rows = await prisma.symbol.findMany({
          where: { profileId },
          select: {
            ...SYMBOL_SELECT_CORE,
            opensKeyboard: true,
            wordVariants: true,
          },
        })
        return rows.map((r) => ({ ...r, fixedCell: false, ...TAP_AUDIO_DEFAULTS }))
      } catch (e3) {
        const w3 =
          isUnknownPrismaFieldError(e3, ['opensKeyboard']) ||
          isMissingDatabaseColumnError(e3, 'opens_keyboard')

        if (!w3) throw e3

        const rows = await prisma.symbol.findMany({
          where: { profileId },
          select: { ...SYMBOL_SELECT_CORE },
        })
        return rows.map((r) => ({
          ...r,
          opensKeyboard: false,
          wordVariants: null,
          fixedCell: false,
          ...TAP_AUDIO_DEFAULTS,
        }))
      }
    }
  }
}
