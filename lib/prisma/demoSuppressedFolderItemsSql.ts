import { prisma } from '@/lib/prisma'
import { parseDemoSuppressedFolderItemsJson } from '@/lib/data/defaultSymbols'

/**
 * Lee `demo_suppressed_folder_items` por SQL para no depender de que `prisma generate`
 * se haya ejecutado tras añadir el campo al schema (p. ej. DLL bloqueado en Windows).
 */
export async function loadDemoSuppressedFolderItemsMap(
  userId: string,
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>()
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; demo_suppressed_folder_items: unknown }>>`
      SELECT id, demo_suppressed_folder_items
      FROM profiles
      WHERE user_id = ${userId}
    `
    for (const r of rows) {
      out.set(r.id, parseDemoSuppressedFolderItemsJson(r.demo_suppressed_folder_items))
    }
  } catch {
    // Columna inexistente (migración pendiente) o error transitorio: sin supresiones.
  }
  return out
}
