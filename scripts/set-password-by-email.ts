/**
 * Asigna contraseña local a un usuario existente (p. ej. cuenta OAuth) y vincula proveedor credentials.
 *
 * Uso:
 *   SET_PASSWORD_EMAIL=sergio.tdc.tdc@gmail.com SET_PASSWORD_VALUE='Fisgonlua.2' npx tsx --tsconfig tsconfig.json scripts/set-password-by-email.ts
 */
import './load-env-database.mjs'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getLinkedProviders, linkCredentialsAccount } from '@/lib/auth/accounts'
import { normalizeAuthEmail } from '@/lib/auth/normalizeEmail'

const email = normalizeAuthEmail(process.env.SET_PASSWORD_EMAIL || '')
const password = process.env.SET_PASSWORD_VALUE || ''

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL (.env o .env.local).')
    process.exit(1)
  }
  if (!email || !password) {
    console.error('Indica SET_PASSWORD_EMAIL y SET_PASSWORD_VALUE.')
    process.exit(1)
  }
  if (password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true },
  })
  if (!user) {
    console.error(`No existe usuario con email: ${email}`)
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  })
  await linkCredentialsAccount(user.id, email)
  const providers = await getLinkedProviders(user.id)

  console.log(`OK — ${email}`)
  console.log(`Contraseña: ${user.password ? 'reemplazada' : 'añadida'}`)
  console.log(`Proveedores: ${providers.join(', ')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
