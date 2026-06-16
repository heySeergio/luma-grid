import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import * as OTPAuth from 'otpauth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret } from '@/lib/auth/crypto'

const APP_NAME = 'Luma Grid'
const BACKUP_CODE_COUNT = 10

export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 })
  return secret.base32
}

export function getTotpUri(email: string, secretBase32: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
  return totp.toString()
}

export function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
  const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 1 })
  return delta !== null
}

export async function verifyTotpForUser(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) return false
  const secret = decryptSecret(user.twoFactorSecret)
  return verifyTotpCode(secret, code)
}

export function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const part = randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${part.slice(0, 4)}-${part.slice(4, 8)}`)
  }
  return codes
}

export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code.replace(/\s/g, '').toUpperCase(), 10)
}

export async function verifyAndConsumeBackupCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s/g, '').toUpperCase()
  const rows = await prisma.backupCode.findMany({
    where: { userId, usedAt: null },
  })
  for (const row of rows) {
    const match = await bcrypt.compare(normalized, row.codeHash)
    if (match) {
      await prisma.backupCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      })
      return true
    }
  }
  return false
}

export async function enableTwoFactorForUser(
  userId: string,
  secretBase32: string,
): Promise<string[]> {
  const plainCodes = generateBackupCodes()
  const encrypted = encryptSecret(secretBase32)
  await prisma.$transaction(async (tx) => {
    await tx.backupCode.deleteMany({ where: { userId } })
    await tx.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorSecret: encrypted },
    })
    for (const c of plainCodes) {
      await tx.backupCode.create({
        data: { userId, codeHash: await hashBackupCode(c) },
      })
    }
  })
  return plainCodes
}

export async function disableTwoFactorForUser(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.backupCode.deleteMany({ where: { userId } })
    await tx.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    })
  })
}

/** Secreto temporal en memoria para setup (no persistido hasta confirmar). */
const pendingSetupSecrets = new Map<string, { secret: string; exp: number }>()

export function storePendingSetupSecret(userId: string, secret: string): void {
  pendingSetupSecrets.set(userId, { secret, exp: Date.now() + 10 * 60 * 1000 })
}

export function takePendingSetupSecret(userId: string): string | null {
  const row = pendingSetupSecrets.get(userId)
  pendingSetupSecrets.delete(userId)
  if (!row || row.exp < Date.now()) return null
  return row.secret
}

export function signSetupSession(userId: string, secret: string): string {
  const payload = `${userId}:${secret}:${Date.now()}`
  const sig = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'dev').update(payload).digest('hex')
  return Buffer.from(`${payload}:${sig}`).toString('base64url')
}

export function verifySetupSession(token: string, userId: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    const lastColon = decoded.lastIndexOf(':')
    if (lastColon < 0) return null
    const sig = decoded.slice(lastColon + 1)
    const body = decoded.slice(0, lastColon)
    const expected = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'dev')
      .update(body)
      .digest('hex')
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null
    }
    const [uid, secret, ts] = body.split(':')
    if (uid !== userId) return null
    if (Date.now() - Number(ts) > 10 * 60 * 1000) return null
    return secret
  } catch {
    return null
  }
}
