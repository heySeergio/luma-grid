import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'

/** Único email autorizado en stats.lumagrid.app */
export const STATS_ALLOWED_EMAILS = new Set(
  ['sergio.tdc.tdc@gmail.com'].map((e) => e.toLowerCase()),
)

export function isStatsAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return STATS_ALLOWED_EMAILS.has(normalizeAuthEmail(email))
}
