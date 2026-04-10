import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Dimensiones del grid sin usar `prisma.profile` (evita SELECT implícito de columnas aún no migradas). */
export async function readProfileGridDimensionsForOwner(
  profileId: string,
  userId: string,
): Promise<{ gridRows: number; gridCols: number } | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ grid_rows: number; grid_cols: number }>>`
      SELECT grid_rows, grid_cols FROM profiles
      WHERE id = ${profileId} AND user_id = ${userId} LIMIT 1
    `
    const r = rows[0]
    if (!r) return null
    return { gridRows: r.grid_rows, gridCols: r.grid_cols }
  } catch {
    return null
  }
}

/** grid + is_demo para guardados / cuotas sin `findUnique` sobre el modelo completo. */
export async function readProfileGridAndDemoForOwner(
  profileId: string,
  userId: string,
): Promise<{ gridRows: number; gridCols: number; isDemo: boolean } | null> {
  try {
    const rows = await prisma.$queryRaw<
      Array<{ grid_rows: number; grid_cols: number; is_demo: boolean }>
    >`
      SELECT grid_rows, grid_cols, is_demo FROM profiles
      WHERE id = ${profileId} AND user_id = ${userId} LIMIT 1
    `
    const r = rows[0]
    if (!r) return null
    return { gridRows: r.grid_rows, gridCols: r.grid_cols, isDemo: r.is_demo }
  } catch {
    return null
  }
}

/**
 * Lectura/escritura de `profiles.fixed_zone_cells` por SQL.
 * Evita PrismaClientValidationError cuando el cliente generado aún no incluye el campo (hay que ejecutar `prisma generate`).
 */
export async function readFixedZoneCellsMapForUser(userId: string): Promise<Map<string, unknown>> {
  const map = new Map<string, unknown>()
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; fixed_zone_cells: unknown }>>`
      SELECT id, fixed_zone_cells FROM profiles WHERE user_id = ${userId}
    `
    for (const r of rows) {
      map.set(r.id, r.fixed_zone_cells)
    }
  } catch {
    /* columna ausente o entorno sin migración */
  }
  return map
}

export async function readFixedZoneCellsForProfile(
  profileId: string,
  userId: string,
): Promise<unknown | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{ fixed_zone_cells: unknown | null }>>`
      SELECT fixed_zone_cells FROM profiles WHERE id = ${profileId} AND user_id = ${userId} LIMIT 1
    `
    return rows[0]?.fixed_zone_cells ?? null
  } catch {
    return null
  }
}

export async function setFixedZoneCellsForProfile(
  profileId: string,
  userId: string,
  value: Prisma.InputJsonValue | null,
): Promise<void> {
  if (value === null) {
    await prisma.$executeRaw`
      UPDATE profiles SET fixed_zone_cells = NULL
      WHERE id = ${profileId} AND user_id = ${userId}
    `
    return
  }
  await prisma.$executeRaw`
    UPDATE profiles
    SET fixed_zone_cells = ${JSON.stringify(value)}::jsonb
    WHERE id = ${profileId} AND user_id = ${userId}
  `
}
