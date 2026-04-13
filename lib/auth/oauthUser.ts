import { prisma } from '@/lib/prisma'
import { normalizeLabelForLexicalMatch } from '@/lib/lexicon/normalize'
import { DEFAULT_SYMBOLS, DEFAULT_FOLDER_TILES } from '@/lib/data/defaultSymbols'
import { Prisma, type User } from '@prisma/client'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

const DEMO_REGISTRATION_SEED = [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].slice(0, 60)

function prismaRowsForDemoSeed(profileId: string) {
  return DEMO_REGISTRATION_SEED.map((symbol) => ({
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
    ...(symbol.wordVariants
      ? {
          wordVariants: JSON.parse(JSON.stringify(symbol.wordVariants)) as Prisma.InputJsonValue,
        }
      : {}),
  }))
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
      data: prismaRowsForDemoSeed(profileId),
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
      data: prismaRowsForDemoSeed(profileId),
    })

    await tx.user.update({
      where: { id: created.id },
      data: { defaultProfileId: profileId },
    })

    return created
  })
}

/**
 * Borra todos los símbolos del perfil y vuelve a insertar el mismo lote que en el alta OAuth/contraseña (60 filas).
 * Limpia transiciones de predicción y frases guardadas del perfil; restaura grid 14×8 y anula supresiones de plantilla / zona fija.
 */
export async function resetDemoProfileToRegistrationSeed(profileId: string): Promise<{ inserted: number }> {
  const rows = prismaRowsForDemoSeed(profileId)
  await prisma.$transaction(async (tx) => {
    await tx.symbol.deleteMany({ where: { profileId } })
    await tx.predictionTransition.deleteMany({ where: { profileId } })
    await tx.phrase.deleteMany({ where: { profileId } })
    await tx.profile.update({
      where: { id: profileId },
      data: {
        gridRows: 8,
        gridCols: 14,
        demoSuppressedTemplateLabels: Prisma.JsonNull,
        fixedZoneCells: Prisma.JsonNull,
      },
    })
    try {
      await tx.$executeRaw`UPDATE profiles SET demo_suppressed_folder_items = NULL WHERE id = ${profileId}`
    } catch {
      /* columna ausente hasta migrar */
    }
    await tx.symbol.createMany({ data: rows })
  })
  return { inserted: rows.length }
}

/** Localiza el perfil `isDemo` del usuario y restaura el tablero base de fábrica. */
export async function resetDemoBoardByUserEmail(email: string): Promise<{
  profileId: string
  profileName: string
  inserted: number
}> {
  const normalized = normalizeEmail(email)
  const user = await prisma.user.findUnique({ where: { email: normalized } })
  if (!user) {
    throw new Error(`No existe usuario con email: ${normalized}`)
  }
  const profile = await prisma.profile.findFirst({
    where: { userId: user.id, isDemo: true },
  })
  if (!profile) {
    throw new Error(`El usuario ${normalized} no tiene perfil con isDemo=true (Tablero Base)`)
  }
  const { inserted } = await resetDemoProfileToRegistrationSeed(profile.id)
  return { profileId: profile.id, profileName: profile.name, inserted }
}
