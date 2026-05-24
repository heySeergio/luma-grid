import { prisma } from '@/lib/prisma'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'

/** Lectura directa por SQL: válida aunque el cliente Prisma no tenga aún los campos nuevos. */
export async function readAdminGettingStartedDismissedFromDb(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ admin_getting_started_dismissed: boolean | null }>>`
      SELECT "admin_getting_started_dismissed"
      FROM "User" WHERE "id" = ${userId} LIMIT 1
    `
    return rows[0]?.admin_getting_started_dismissed === true
  } catch {
    return false
  }
}

export type TableroUiPrefs = {
  showFrequentPhrasesSection: boolean
  showPhraseCompletionSection: boolean
  showRestModeButton: boolean
  showGridCellPredictions: boolean
  keyboardPictoAutocomplete: boolean
  keyboardArasaacPictograms: boolean
}

const TABLERO_UI_COLUMN_ENSURES = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_frequent_phrases_section" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_phrase_completion_section" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_rest_mode_button" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "show_grid_cell_predictions" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "keyboard_picto_autocomplete" BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "keyboard_arasaac_pictograms" BOOLEAN NOT NULL DEFAULT true`,
] as const

let tableroUiColumnsReady = false
let tableroUiColumnsEnsurePromise: Promise<boolean> | null = null

/** Crea columnas de preferencias de /tablero si la migración aún no se aplicó (una vez por proceso). */
export async function ensureTableroUiPrefColumns(): Promise<boolean> {
  if (tableroUiColumnsReady) return true
  if (!tableroUiColumnsEnsurePromise) {
    tableroUiColumnsEnsurePromise = (async () => {
      try {
        for (const sql of TABLERO_UI_COLUMN_ENSURES) {
          await prisma.$executeRawUnsafe(sql)
        }
        tableroUiColumnsReady = true
        return true
      } catch {
        return false
      } finally {
        tableroUiColumnsEnsurePromise = null
      }
    })()
  }
  return tableroUiColumnsEnsurePromise
}

function rowToTableroUiPrefs(r: {
  show_frequent_phrases_section: boolean | null
  show_phrase_completion_section: boolean | null
  show_rest_mode_button: boolean | null
  show_grid_cell_predictions: boolean | null
  keyboard_picto_autocomplete: boolean | null
  keyboard_arasaac_pictograms: boolean | null
}): TableroUiPrefs {
  return {
    showFrequentPhrasesSection: r.show_frequent_phrases_section !== false,
    showPhraseCompletionSection: r.show_phrase_completion_section !== false,
    showRestModeButton: r.show_rest_mode_button !== false,
    showGridCellPredictions: r.show_grid_cell_predictions !== false,
    keyboardPictoAutocomplete: r.keyboard_picto_autocomplete !== false,
    keyboardArasaacPictograms: r.keyboard_arasaac_pictograms !== false,
  }
}

/** Preferencias visuales de /tablero; null si la lectura SQL no fue posible. */
export async function readTableroUiPrefsFromDb(userId: string): Promise<TableroUiPrefs | null> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{
        show_frequent_phrases_section: boolean | null
        show_phrase_completion_section: boolean | null
        show_rest_mode_button: boolean | null
        show_grid_cell_predictions: boolean | null
        keyboard_picto_autocomplete: boolean | null
        keyboard_arasaac_pictograms: boolean | null
      }>
    >`
      SELECT
        "show_frequent_phrases_section",
        "show_phrase_completion_section",
        "show_rest_mode_button",
        "show_grid_cell_predictions",
        "keyboard_picto_autocomplete",
        "keyboard_arasaac_pictograms"
      FROM "User" WHERE "id" = ${userId} LIMIT 1
    `
    const r = rows[0]
    if (!r) return null
    return rowToTableroUiPrefs(r)
  } catch {
    return null
  }
}

async function executeTableroUiPrefsUpdate(userId: string, prefs: TableroUiPrefs): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "User" SET
      "show_frequent_phrases_section" = ${prefs.showFrequentPhrasesSection},
      "show_phrase_completion_section" = ${prefs.showPhraseCompletionSection},
      "show_rest_mode_button" = ${prefs.showRestModeButton},
      "show_grid_cell_predictions" = ${prefs.showGridCellPredictions},
      "keyboard_picto_autocomplete" = ${prefs.keyboardPictoAutocomplete},
      "keyboard_arasaac_pictograms" = ${prefs.keyboardArasaacPictograms}
    WHERE "id" = ${userId}
  `
}

export async function writeTableroUiPrefsToDb(userId: string, prefs: TableroUiPrefs): Promise<boolean> {
  try {
    await executeTableroUiPrefsUpdate(userId, prefs)
    return true
  } catch {
    const columnsReady = await ensureTableroUiPrefColumns()
    if (!columnsReady) return false
    try {
      await executeTableroUiPrefsUpdate(userId, prefs)
      return true
    } catch {
      return false
    }
  }
}

export async function writeAccountPrivacyPrefsToDb(
  userId: string,
  prefs: { defaultTableroTab: DefaultTableroTab; shareUsageForPredictions: boolean },
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "User" SET
        "default_tablero_tab" = ${prefs.defaultTableroTab},
        "share_usage_for_predictions" = ${prefs.shareUsageForPredictions}
      WHERE "id" = ${userId}
    `
  } catch {
    /* columna ausente o BD no disponible */
  }
}

export async function readAccountPrivacyPrefsFromDb(userId: string): Promise<{
  defaultTableroTab: DefaultTableroTab
  shareUsageForPredictions: boolean
}> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ default_tablero_tab: string | null; share_usage_for_predictions: boolean | null }>
    >`
      SELECT "default_tablero_tab", "share_usage_for_predictions"
      FROM "User" WHERE "id" = ${userId} LIMIT 1
    `
    const r = rows[0]
    return {
      defaultTableroTab: parseDefaultTableroTab(r?.default_tablero_tab),
      shareUsageForPredictions: r?.share_usage_for_predictions !== false,
    }
  } catch {
    return { defaultTableroTab: 'grid', shareUsageForPredictions: true }
  }
}
