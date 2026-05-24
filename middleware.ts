import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authSecret =
  process.env.NEXTAUTH_SECRET || "luma-grids-super-secret-local-key-2026!@#"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret })

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/tablero/:path*",
    "/api/symbols/:path*",
    "/api/profiles/:path*",
  ],
}
