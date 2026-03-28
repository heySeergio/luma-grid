import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'
import { normalizeTextForLexicon } from '@/lib/lexicon/normalize'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
/** Evita timeouts al sembrar muchos símbolos en un solo request (p. ej. Vercel). */
export const maxDuration = 60

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function isMissingDatabaseUrlError(error: unknown) {
    return (
        error instanceof Error &&
        error.message.includes('Environment variable not found: DATABASE_URL')
    )
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const email = typeof body.email === 'string' ? normalizeEmail(body.email) : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const name = typeof body.name === 'string' ? body.name.trim() : ''

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
        }

        if (!process.env.DATABASE_URL?.trim()) {
            return NextResponse.json(
                { error: 'Falta configurar DATABASE_URL en .env.local (o variables del entorno).' },
                { status: 500 },
            )
        }

        const { prisma } = await import('@/lib/prisma')
        const { DEFAULT_SYMBOLS, DEFAULT_FOLDER_TILES } = await import('@/lib/data/defaultSymbols')

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'El correo electrónico ya está registrado.' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        /** Plan Libre: máximo 60 botones totales (incl. carpetas). */
        const seed = [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].slice(0, 60)

        // Usuario + perfil en una transacción; símbolos con createMany (un INSERT masivo, más rápido que cientos de INSERT anidados).
        const user = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || null,
                    planSelectionCompletedAt: null,
                    profiles: {
                        create: {
                            name: 'Demo Profile',
                            isDemo: true,
                            gender: 'male',
                        },
                    },
                },
                include: { profiles: { select: { id: true } } },
            })

            const profileId = created.profiles[0]?.id
            if (!profileId) {
                throw new Error('No se pudo crear el perfil DEMO')
            }

            await tx.symbol.createMany({
                data: seed.map((symbol) => ({
                    profileId,
                    gridId: 'demo',
                    label: symbol.label,
                    normalizedLabel: normalizeTextForLexicon(symbol.label),
                    emoji: symbol.emoji ?? null,
                    category: symbol.category,
                    posType: symbol.posType,
                    positionX: symbol.positionX,
                    positionY: symbol.positionY,
                    color: symbol.color,
                    hidden: symbol.hidden,
                    state: 'visible',
                })),
            })

            return created
        })

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Registration error:', error)
        if (isMissingDatabaseUrlError(error)) {
            return NextResponse.json(
                { error: 'Falta configurar DATABASE_URL en .env.local (o variables del entorno).' },
                { status: 500 },
            )
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[] | undefined)?.join(', ')
                if (target?.includes('email')) {
                    return NextResponse.json(
                        { error: 'El correo electrónico ya está registrado.' },
                        { status: 409 },
                    )
                }
            }
        }
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
