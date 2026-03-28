import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            preferredTheme?: "light" | "dark" | "system"
            preferredDyslexiaFont?: boolean
        } & DefaultSession["user"]
    }

    interface User {
        preferredTheme?: "light" | "dark" | "system"
        preferredDyslexiaFont?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        preferredTheme?: "light" | "dark" | "system"
        preferredDyslexiaFont?: boolean
    }
}
