import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            preferredTheme?: "light" | "dark" | "system"
            preferredDyslexiaFont?: boolean
            /** Vista inicial en /tablero; sincronizada con User.defaultTableroTab */
            defaultTableroTab?: "grid" | "keyboard"
        } & DefaultSession["user"]
    }

    interface User {
        preferredTheme?: "light" | "dark" | "system"
        preferredDyslexiaFont?: boolean
        defaultTableroTab?: "grid" | "keyboard"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        preferredTheme?: "light" | "dark" | "system"
        preferredDyslexiaFont?: boolean
        defaultTableroTab?: "grid" | "keyboard"
    }
}
