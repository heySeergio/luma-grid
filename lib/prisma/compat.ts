import { Prisma } from '@prisma/client'

export function isUnknownPrismaFieldError(error: unknown, fields: string[]) {
  return (
    error instanceof Error &&
    (error.message.includes('Unknown field') || error.message.includes('Unknown argument')) &&
    fields.some((field) => error.message.includes(field))
  )
}

/**
 * Migración pendiente o shadow DB desactualizado: Prisma intenta leer una columna que aún no existe.
 * (El mensaje no coincide con `isUnknownPrismaFieldError`.)
 */
export function isMissingDatabaseColumnError(error: unknown, columnSubstr: string) {
  if (!columnSubstr || error == null) return false

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
    if (error.message.includes(columnSubstr)) return true
    const meta = error.meta as { column?: string } | undefined
    if (typeof meta?.column === 'string' && meta.column.includes(columnSubstr)) return true
  }

  if (error instanceof Error) {
    const msg = error.message
    return msg.includes(columnSubstr) && /does not exist in the current database/i.test(msg)
  }

  return false
}
