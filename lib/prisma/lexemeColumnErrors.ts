import { Prisma } from '@prisma/client'

/**
 * Columnas nuevas en migración lexeme_semantic_layer que pueden faltar si no se ha ejecutado migrate deploy.
 */
export function isMissingLexemeColumnError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
    const meta = error.meta as { modelName?: string; column?: string } | undefined
    const col = meta?.column != null ? String(meta.column) : ''
    if (meta?.modelName === 'Lexeme') return true
    if (/lexeme/i.test(col)) return true
    if (/is_core|semantic_layer|lexeme_tier/i.test(col)) return true
    if (/lexeme/i.test(error.message)) return true
  }
  const msg = error instanceof Error ? error.message : String(error ?? '')
  return (
    msg.includes('does not exist') &&
    (/\blexemes\b/i.test(msg) || /is_core|semantic_layer|lexeme_tier/i.test(msg))
  )
}
