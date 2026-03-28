import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "hola@lumagrid.app" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
                    return null
                }

                const [prismaMod, bcryptMod] = await Promise.all([
                    import("@/lib/prisma"),
                    import("bcryptjs"),
                ])
                const prisma = prismaMod.prisma
                const email = normalizeEmail(credentials.email)
                const user = await prisma.user.findUnique({
                    where: { email }
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcryptMod.default.compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    preferredTheme: user.preferredTheme as "light" | "dark" | "system",
                    preferredDyslexiaFont: Boolean(user.preferredDyslexiaFont),
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "luma-grids-super-secret-local-key-2026!@#",
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user?.preferredTheme) {
                token.preferredTheme = user.preferredTheme
            }

            if (typeof user?.preferredDyslexiaFont === 'boolean') {
                token.preferredDyslexiaFont = user.preferredDyslexiaFont
            }

            if (trigger === 'update' && session?.user?.preferredTheme) {
                token.preferredTheme = session.user.preferredTheme
            }

            if (trigger === 'update' && typeof session?.user?.preferredDyslexiaFont === 'boolean') {
                token.preferredDyslexiaFont = session.user.preferredDyslexiaFont
            }

            if (trigger === 'update' && session?.user?.name) {
                token.name = session.user.name
            }

            if (trigger === 'update' && session?.user?.email) {
                token.email = session.user.email
            }

            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string
                session.user.preferredTheme = token.preferredTheme as "light" | "dark" | "system" | undefined
                session.user.preferredDyslexiaFont = typeof token.preferredDyslexiaFont === 'boolean' ? token.preferredDyslexiaFont : undefined
                if (typeof token.name === 'string') {
                    session.user.name = token.name
                }
                if (typeof token.email === 'string') {
                    session.user.email = token.email
                }
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`
            }

            try {
                const targetUrl = new URL(url)
                if (targetUrl.origin === baseUrl) {
                    return url
                }
            } catch {
                return baseUrl
            }

            return baseUrl
        },
    }
}
