'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Phrase } from '@/lib/supabase/types'

export async function getPinnedPhrases(profileId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    const phrases = await prisma.phrase.findMany({
        where: { profileId, isPinned: true },
        orderBy: { useCount: 'desc' },
        take: 10,
    })

    return phrases.map(p => ({
        id: p.id,
        profileId: p.profileId,
        text: p.text,
        symbolsUsed: JSON.parse(p.symbolsUsed) as Phrase['symbolsUsed'],
        createdAt: p.createdAt.toISOString(),
        isPinned: p.isPinned,
        useCount: p.useCount,
    }))
}

export async function saveQuickPhrase(profileId: string, text: string, symbolsUsed: Phrase['symbolsUsed']) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error('No autorizado')

    // Find if phrase with exact text exists
    const existing = await prisma.phrase.findFirst({
        where: { profileId, text }
    })

    if (existing) {
        await prisma.phrase.update({
            where: { id: existing.id },
            data: { useCount: { increment: 1 } }
        })
    } else {
        await prisma.phrase.create({
            data: {
                profileId,
                text,
                symbolsUsed: JSON.stringify(symbolsUsed),
                useCount: 1,
            }
        })
    }
}
