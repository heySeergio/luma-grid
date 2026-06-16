'use server'

import QRCode from 'qrcode'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  disableTwoFactorForUser,
  enableTwoFactorForUser,
  generateTotpSecret,
  getTotpUri,
  signSetupSession,
  storePendingSetupSecret,
  takePendingSetupSecret,
  verifySetupSession,
  verifyTotpCode,
  verifyTotpForUser,
} from '@/lib/auth/twoFactor'
import {
  requireSessionUser,
  requireSessionUserId,
  userNeedsEmailVerification,
} from '@/lib/auth/sessionHelpers'
import bcrypt from 'bcryptjs'

export async function beginTwoFactorSetup(): Promise<{ qrDataUrl: string; setupToken: string }> {
  const { id: userId, email } = await requireSessionUser()
  if (await userNeedsEmailVerification(userId)) {
    throw new Error('Verifica tu correo antes de activar 2FA')
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  })
  if (user?.twoFactorEnabled) throw new Error('2FA ya está activo')

  const secret = generateTotpSecret()
  storePendingSetupSecret(userId, secret)
  const uri = getTotpUri(email, secret)
  const qrDataUrl = await QRCode.toDataURL(uri)
  const setupToken = signSetupSession(userId, secret)
  return { qrDataUrl, setupToken }
}

export async function confirmTwoFactorSetup(
  code: string,
  setupToken: string,
): Promise<{ backupCodes: string[] }> {
  const userId = await requireSessionUserId()

  const secret =
    verifySetupSession(setupToken, userId) ?? takePendingSetupSecret(userId)
  if (!secret) throw new Error('La configuración ha caducado. Vuelve a empezar.')

  if (!verifyTotpCode(secret, code)) throw new Error('Código incorrecto')

  const backupCodes = await enableTwoFactorForUser(userId, secret)
  revalidatePath('/admin')
  return { backupCodes }
}

export async function disableTwoFactor(opts: {
  password?: string
  totpCode?: string
}): Promise<void> {
  const userId = await requireSessionUserId()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, twoFactorEnabled: true },
  })
  if (!user?.twoFactorEnabled) return

  let verified = false
  if (opts.totpCode?.trim()) {
    verified = await verifyTotpForUser(userId, opts.totpCode)
  } else if (opts.password && user.password) {
    verified = await bcrypt.compare(opts.password, user.password)
  }
  if (!verified) throw new Error('No se pudo verificar tu identidad')

  await disableTwoFactorForUser(userId)
  revalidatePath('/admin')
}
