import type { Prisma } from '@prisma/client'

/** Campos de User necesarios para sesión/JWT; evita fallos si hay migraciones pendientes. */
export const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  preferredTheme: true,
  preferredDyslexiaFont: true,
} satisfies Prisma.UserSelect

export type SessionUserRecord = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>
