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

/**
 * Símbolos de un tablero con degradación si la BD aún no tiene `word_variants` u `opens_keyboard`.
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
      },
    })
  } catch (e1) {
    const w1 =
      isUnknownPrismaFieldError(e1, ['opensKeyboard', 'wordVariants', 'fixedCell']) ||
      isMissingDatabaseColumnError(e1, 'word_variants') ||
      isMissingDatabaseColumnError(e1, 'opens_keyboard') ||
      isMissingDatabaseColumnError(e1, 'fixed_cell')

    if (!w1) throw e1

    try {
      const rows = await prisma.symbol.findMany({
        where: { profileId },
        select: {
          ...SYMBOL_SELECT_CORE,
          opensKeyboard: true,
          wordVariants: true,
        },
      })
      return rows.map((r) => ({ ...r, fixedCell: false }))
    } catch (e2) {
      const w2 =
        isUnknownPrismaFieldError(e2, ['opensKeyboard']) ||
        isMissingDatabaseColumnError(e2, 'opens_keyboard')

      if (!w2) throw e2

      const rows = await prisma.symbol.findMany({
        where: { profileId },
        select: { ...SYMBOL_SELECT_CORE },
      })
      return rows.map((r) => ({
        ...r,
        opensKeyboard: false,
        wordVariants: null,
        fixedCell: false,
      }))
    }
  }
}
