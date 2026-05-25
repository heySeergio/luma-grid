import type { Session } from 'next-auth'
import { redirect } from 'next/navigation'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getIntranetOwnerEmail(): string | null {
  const raw = process.env.INTRANET_OWNER_EMAIL?.trim()
  if (!raw) return null
  return normalizeEmail(raw)
}

export function isIntranetOwner(email: string | null | undefined): boolean {
  const owner = getIntranetOwnerEmail()
  if (!owner || !email) return false
  return normalizeEmail(email) === owner
}

export function assertIntranetOwner(session: Session | null): void {
  if (!getIntranetOwnerEmail()) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '[intranet] Falta INTRANET_OWNER_EMAIL en .env.local — define el correo del owner y reinicia el servidor.',
      )
    }
    redirect('/')
  }
  if (!isIntranetOwner(session?.user?.email ?? null)) {
    redirect('/')
  }
}

export function intranetUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
