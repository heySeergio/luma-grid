export function isUnknownPrismaFieldError(error: unknown, fields: string[]) {
  return (
    error instanceof Error &&
    (error.message.includes('Unknown field') || error.message.includes('Unknown argument')) &&
    fields.some((field) => error.message.includes(field))
  )
}
