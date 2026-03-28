import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
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

        const { prisma } = await import('@/lib/prisma')
        const { DEFAULT_SYMBOLS, DEFAULT_FOLDER_TILES } = await import('@/lib/data/defaultSymbols')

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'El correo electrónico ya está registrado.' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear el usuario junto con un perfil DEMO y sus símbolos por defecto
        const user = await prisma.$transaction(async (tx) => {
            return tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || null,
                    profiles: {
                        create: {
                            name: 'Demo Profile',
                            isDemo: true,
                            gender: 'male',
                            symbols: {
                                create: [...DEFAULT_SYMBOLS, ...DEFAULT_FOLDER_TILES].map((symbol) => ({
                                    gridId: 'demo',
                                    label: symbol.label,
                                    emoji: symbol.emoji,
                                    category: symbol.category,
                                    posType: symbol.posType,
                                    positionX: symbol.positionX,
                                    positionY: symbol.positionY,
                                    color: symbol.color,
                                    hidden: symbol.hidden,
                                    state: 'visible',
                                })),
                            },
                        },
                    },
                },
            })
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
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
