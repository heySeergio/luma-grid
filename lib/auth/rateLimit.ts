const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const row = buckets.get(key)
  if (!row || row.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (row.count >= maxAttempts) {
    return { allowed: false, retryAfterSec: Math.ceil((row.resetAt - now) / 1000) }
  }
  row.count += 1
  return { allowed: true }
}

export function rateLimitKey(prefix: string, ip: string): string {
  return `${prefix}:${ip}`
}

export function getClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}
