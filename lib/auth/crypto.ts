import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function getEncryptionKey(): Buffer {
  const raw =
    process.env.AUTH_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'luma-auth-dev-encryption-key-change-in-prod'
  return createHash('sha256').update(raw, 'utf8').digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, getEncryptionKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64url')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + 16)
  const enc = buf.subarray(IV_LEN + 16)
  const decipher = createDecipheriv(ALGO, getEncryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}
