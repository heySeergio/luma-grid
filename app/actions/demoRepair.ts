'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { findManySymbolsByProfileId } from '@/lib/prisma/symbolsForProfile'
import { getDemoTemplatePositionMap } from '@/lib/data/defaultSymbols'

/** Reasigna coordenadas de los símbolos del tablero demo a la plantilla MAIN_GRID_TEMPLATE y fija 14×8. */
export async function resetDemoProfilePositionsToTemplate(profileId: string): Promise<{ realigned: number }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('No autorizado')

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: session.user.id, isDemo: true },
  })
  if (!profile) throw new Error('Tablero no encontrado o no es el tablero demo')

  const posMap = getDemoTemplatePositionMap()
  const symbols = await findManySymbolsByProfileId(profileId)

  let realigned = 0
  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profileId },
      data: { gridRows: 8, gridCols: 14 },
    })
    for (const s of symbols) {
      const pos = posMap.get(s.label.trim().toLowerCase())
      if (!pos) continue
      if (s.positionX === pos.x && s.positionY === pos.y) continue
      await tx.symbol.update({
        where: { id: s.id },
        data: { positionX: pos.x, positionY: pos.y },
      })
      realigned += 1
    }
  })

  revalidatePath('/admin')
  revalidatePath('/tablero')
  return { realigned }
}
