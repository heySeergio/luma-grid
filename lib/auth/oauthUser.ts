import { prisma } from '@/lib/prisma'
import { normalizeLabelForLexicalMatch } from '@/lib/lexicon/normalize'
import { DEFAULT_SYMBOLS, DEFAULT_FOLDER_TILES } from '@/lib/data/defaultSymbols'
import type { User } from '@prisma/client'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

/**
 * Crea usuario con contraseña local y el mismo tablero DEMO + símbolos que el alta OAuth.
 * @throws Error con mensaje `EMAIL_IN_USE` si el correo ya existe.
 */
export async function createUserWithPasswordAndDemo(opts: {
  email: string
  passwordHash: string
  name?: string | null
}): Promise<User> {
  const email = normalizeEmail(opts.email)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err = new Error('EMAIL_IN_USE')
    throw err
  }

  const seed = [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].slice(0, 60)

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        password: opts.passwordHash,
        name: opts.name?.trim() || null,
        planSelectionCompletedAt: null,
        profiles: {
          create: {
            name: 'Tablero Base',
            isDemo: true,
            gender: 'male',
          },
        },
      },
      include: { profiles: { select: { id: true } } },
    })

    const profileId = created.profiles[0]?.id
    if (!profileId) {
      throw new Error('No se pudo crear el tablero DEMO')
    }

    await tx.symbol.createMany({
      data: seed.map((symbol) => ({
        profileId,
        gridId: 'demo',
        label: symbol.label,
        normalizedLabel: normalizeLabelForLexicalMatch(symbol.label),
        emoji: symbol.emoji ?? null,
        imageUrl: symbol.imageUrl ?? null,
        category: symbol.category,
        posType: symbol.posType,
        positionX: symbol.positionX,
        positionY: symbol.positionY,
        color: symbol.color,
        hidden: symbol.hidden,
        state: 'visible',
      })),
    })

    await tx.user.update({
      where: { id: created.id },
      data: { defaultProfileId: profileId },
    })

    return created
  })
}

/**
 * Busca usuario por email o lo crea con tablero DEMO y símbolos iniciales (p. ej. Google).
 */
export async function findOrCreateUserFromOAuth(opts: {
  email: string
  name: string | null | undefined
}): Promise<User> {
  const email = normalizeEmail(opts.email)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return existing
  }

  const seed = [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].slice(0, 60)

  return prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        password: null,
        name: opts.name?.trim() || null,
        planSelectionCompletedAt: null,
        profiles: {
          create: {
            name: 'Tablero Base',
            isDemo: true,
            gender: 'male',
          },
        },
      },
      include: { profiles: { select: { id: true } } },
    })

    const profileId = created.profiles[0]?.id
    if (!profileId) {
      throw new Error('No se pudo crear el tablero DEMO')
    }

    await tx.symbol.createMany({
      data: seed.map((symbol) => ({
        profileId,
        gridId: 'demo',
        label: symbol.label,
        normalizedLabel: normalizeLabelForLexicalMatch(symbol.label),
        emoji: symbol.emoji ?? null,
        imageUrl: symbol.imageUrl ?? null,
        category: symbol.category,
        posType: symbol.posType,
        positionX: symbol.positionX,
        positionY: symbol.positionY,
        color: symbol.color,
        hidden: symbol.hidden,
        state: 'visible',
      })),
    })

    await tx.user.update({
      where: { id: created.id },
      data: { defaultProfileId: profileId },
    })

    return created
  })
}
