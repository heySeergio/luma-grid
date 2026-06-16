export function getWebAuthnOrigin(): string {
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return new URL(url).origin
}

export function getWebAuthnRpId(): string {
  const host = new URL(getWebAuthnOrigin()).hostname
  if (host === 'localhost' || host === '127.0.0.1') return 'localhost'
  return host
}

export const webAuthnRpName = 'Luma Grid'
