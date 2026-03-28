import { withAuth } from "next-auth/middleware"

export default withAuth({
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "luma-grids-super-secret-local-key-2026!@#",
})

export const config = {
    matcher: [
        "/admin/:path*",
        "/tablero/:path*",
        "/api/symbols/:path*",
        "/api/profiles/:path*",
    ]
}
