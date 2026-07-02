import { prisma } from '@/lib/prisma'

export async function ensureOrganizationForOwner(userId: string): Promise<string> {
  const existing = await prisma.organization.findUnique({
    where: { ownerUserId: userId },
    select: { id: true },
  })
  if (existing) return existing.id

  const org = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        ownerUserId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
            inviteStatus: 'accepted',
          },
        },
      },
      select: { id: true },
    })
    return created
  })
  return org.id
}
