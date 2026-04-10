import { prisma } from '@/lib/prisma'
import type { DefaultTableroTab } from '@/lib/account/defaultTableroTab'
import { parseDefaultTableroTab } from '@/lib/account/defaultTableroTab'

/** Lectura directa por SQL: válida aunque el cliente Prisma no tenga aún los campos nuevos. */
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
