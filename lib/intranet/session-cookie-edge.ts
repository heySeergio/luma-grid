/** Verificación HMAC compatible con Edge (middleware). */

function getSessionSecret(): string {
  return (
    process.env.INTRANET_SESSION_SECRET?.trim() ||
    process.env.CPANEL_SESSION_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    'luma-intranet-dev-only-set-INTRANET_SESSION_SECRET'
  )
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyIntranetTokenEdge(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacSha256Hex(getSessionSecret(), payload)
  if (!timingSafeEqualStr(sig, expected)) return false
  const exp = Number.parseInt(payload, 10)
  if (Number.isNaN(exp) || exp < Date.now() / 1000) return false
  return true
}
