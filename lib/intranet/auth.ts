import type { Session } from 'next-auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { hasIntranetAccessFromSession } from '@/lib/intranet/access'
import { INTRANET_COOKIE_NAME } from '@/lib/intranet/constants'
import { verifyIntranetToken } from '@/lib/intranet/session-cookie'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getIntranetOwnerEmails(): string[] {
  const raw = process.env.INTRANET_OWNER_EMAIL?.trim()
  if (!raw) return []
  return raw
    .split(/[,;]/)
    .map((part) => normalizeEmail(part))
    .filter(Boolean)
}

/** Primer owner configurado (compat). */
export function getIntranetOwnerEmail(): string | null {
  const list = getIntranetOwnerEmails()
  return list[0] ?? null
}

export function isIntranetOwner(email: string | null | undefined): boolean {
  const owners = getIntranetOwnerEmails()
  if (owners.length === 0 || !email) return false
  const normalized = normalizeEmail(email)
  return owners.includes(normalized)
}

export async function assertIntranetAccess(session: Session | null): Promise<void> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(INTRANET_COOKIE_NAME)?.value
  if (hasIntranetAccessFromSession(session, cookieToken)) return
  redirect('/intranet/login')
}

/** @deprecated Usa assertIntranetAccess */
export async function assertIntranetOwner(session: Session | null): Promise<void> {
  await assertIntranetAccess(session)
}

export function readIntranetCookieFromRequest(
  getCookie: (name: string) => { value: string } | undefined,
): string | undefined {
  const value = getCookie(INTRANET_COOKIE_NAME)?.value
  return value && verifyIntranetToken(value) ? value : undefined
}

export function intranetUnauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'No autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
