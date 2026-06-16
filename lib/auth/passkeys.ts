import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'
import { prisma } from '@/lib/prisma'
import { getWebAuthnOrigin, getWebAuthnRpId, webAuthnRpName } from '@/lib/auth/webauthnConfig'
import { SignJWT, jwtVerify } from 'jose'

function challengeSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'dev-challenge-secret')
}

export async function signWebAuthnChallenge(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(challengeSecret())
}

export async function verifyWebAuthnChallenge<T extends Record<string, unknown>>(
  token: string,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, challengeSecret())
    return payload as T
  } catch {
    return null
  }
}

export async function buildRegistrationOptions(userId: string, email: string, userName: string | null) {
  const passkeys = await prisma.passkey.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  })
  const options = await generateRegistrationOptions({
    rpName: webAuthnRpName,
    rpID: getWebAuthnRpId(),
    userName: email,
    userDisplayName: userName || email,
    attestationType: 'none',
    excludeCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })
  const challengeToken = await signWebAuthnChallenge({
    challenge: options.challenge,
    userId,
    type: 'registration',
  })
  return { options, challengeToken }
}

export async function verifyRegistration(
  challengeToken: string,
  response: RegistrationResponseJSON,
  deviceName?: string,
) {
  const stored = await verifyWebAuthnChallenge<{ challenge: string; userId: string; type: string }>(
    challengeToken,
  )
  if (!stored || stored.type !== 'registration') {
    throw new Error('Challenge inválido')
  }
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
  })
  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('No se pudo verificar la passkey')
  }
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo
  await prisma.passkey.create({
    data: {
      userId: stored.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceName: deviceName?.trim() || credentialDeviceType,
      transports: credential.transports ?? [],
    },
  })
  return { userId: stored.userId, backedUp: credentialBackedUp }
}

export async function buildAuthenticationOptions(email?: string) {
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { passkeys: true },
    })
    if (user?.passkeys.length) {
      allowCredentials = user.passkeys.map((p) => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransportFuture[],
      }))
    }
  }
  const options = await generateAuthenticationOptions({
    rpID: getWebAuthnRpId(),
    allowCredentials,
    userVerification: 'preferred',
  })
  const challengeToken = await signWebAuthnChallenge({
    challenge: options.challenge,
    email: email?.trim().toLowerCase() || null,
    type: 'authentication',
  })
  return { options, challengeToken }
}

export async function verifyAuthentication(challengeToken: string, response: AuthenticationResponseJSON) {
  const stored = await verifyWebAuthnChallenge<{
    challenge: string
    email: string | null
    type: string
  }>(challengeToken)
  if (!stored || stored.type !== 'authentication') {
    throw new Error('Challenge inválido')
  }
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
    include: { user: { select: { id: true, email: true, twoFactorEnabled: true } } },
  })
  if (!passkey) throw new Error('Passkey no encontrada')
  if (stored.email && passkey.user.email !== stored.email) {
    throw new Error('Passkey no corresponde a este correo')
  }
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: stored.challenge,
    expectedOrigin: getWebAuthnOrigin(),
    expectedRPID: getWebAuthnRpId(),
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
  })
  if (!verification.verified) throw new Error('Verificación fallida')
  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  })
  return passkey.user
}
