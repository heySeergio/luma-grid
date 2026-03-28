import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

/** Evita que el build intente analizar/coleccionar datos estáticos de esta ruta (falla en Vercel sin DB en tiempo de build). */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
