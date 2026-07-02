import { Prisma } from '@prisma/client'
import { normalizeLabelForLexicalMatch } from '@/lib/lexicon/normalize'
import { DEFAULT_SYMBOLS, DEFAULT_FOLDER_TILES } from '@/lib/data/defaultSymbols'

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

type Tx = Pick<Prisma.TransactionClient, 'profile' | 'symbol' | 'user'>

/** Crea tablero DEMO con símbolos iniciales y lo marca como perfil por defecto. */
export async function createDemoProfileForUser(tx: Tx, userId: string): Promise<string> {
  const profile = await tx.profile.create({
    data: {
      name: 'Tablero Base',
      isDemo: true,
      gender: 'male',
      userId,
    },
    select: { id: true },
  })

  await tx.symbol.createMany({
    data: prismaRowsForDemoSeed(profile.id),
  })

  await tx.user.update({
    where: { id: userId },
    data: { defaultProfileId: profile.id },
  })

  return profile.id
}
