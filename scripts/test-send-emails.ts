/**
 * Envía ambos tipos de correo transaccional (verificación y reset) a una dirección de prueba.
 *
 * Uso:
 *   npx tsx --tsconfig tsconfig.json scripts/test-send-emails.ts
 *   TEST_EMAIL=otro@ejemplo.com npx tsx --tsconfig tsconfig.json scripts/test-send-emails.ts
 */
import './load-env-database.mjs'
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '@/lib/email/resend'

const to = (process.env.TEST_EMAIL || 'sergio.tdc.tdc@gmail.com').trim()

async function main() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurada: en dev solo se imprimirá en consola.')
  }

  console.log(`Enviando correos de prueba a ${to}…`)

  const verify = await sendVerificationEmail(to, 'test-verify-token')
  console.log('Verificación:', verify)

  const reset = await sendPasswordResetEmail(to, 'test-reset-token')
  console.log('Reset contraseña:', reset)

  if (!verify.ok || !reset.ok) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
