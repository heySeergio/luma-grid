'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getOptionalSessionUserId, requireSessionUserId, userNeedsEmailVerification } from '@/lib/auth/sessionHelpers'

export type PasskeyListItem = {
  id: string
  deviceName: string | null
  createdAt: string
  lastUsedAt: string | null
}

function mapPasskeyRows(
  rows: { id: string; deviceName: string | null; createdAt: Date; lastUsedAt: Date | null }[],
): PasskeyListItem[] {
  return rows.map((r) => ({
    id: r.id,
    deviceName: r.deviceName,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
  }))
}

export async function listPasskeys(): Promise<PasskeyListItem[]> {
  const userId = await getOptionalSessionUserId()
  if (!userId) return []

  const rows = await prisma.passkey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
  })
  return mapPasskeyRows(rows)
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  const userId = await requireSessionUserId()
  if (await userNeedsEmailVerification(userId)) {
    throw new Error('Verifica tu correo antes de gestionar passkeys')
  }

  await prisma.passkey.deleteMany({
    where: { id: passkeyId, userId },
  })
  revalidatePath('/admin')
}

export async function canManagePasskeys(): Promise<boolean> {
  const userId = await getOptionalSessionUserId()
  if (!userId) return false
  return !(await userNeedsEmailVerification(userId))
}

export async function fetchPasskeysForUser(userId: string): Promise<PasskeyListItem[]> {
  const rows = await prisma.passkey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
  })
  return mapPasskeyRows(rows)
}
