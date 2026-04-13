/**
 * Restaura el tablero DEMO (Tablero Base) al mismo lote que en el registro: borra símbolos,
 * transiciones y frases del perfil demo; reinserta 60 símbolos; grid 14×8; limpia plantilla suprimida.
 *
 * Uso (raíz del proyecto, con DATABASE_URL en .env o .env.local):
 *   npx tsx --tsconfig tsconfig.json scripts/reset-demo-board-by-email.ts
 *   REPAIR_EMAIL=otro@correo.com npx tsx --tsconfig tsconfig.json scripts/reset-demo-board-by-email.ts
 */
import './load-env-database.mjs'
import { prisma } from '@/lib/prisma'
import { resetDemoBoardByUserEmail } from '@/lib/auth/oauthUser'

const email = (process.env.REPAIR_EMAIL || 'sergio.tdc.tdc@gmail.com').trim().toLowerCase()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Falta DATABASE_URL (.env o .env.local).')
    process.exit(1)
  }
  const result = await resetDemoBoardByUserEmail(email)
  console.log(`OK — usuario ${email}`)
  console.log(`Perfil: ${result.profileName} (${result.profileId})`)
  console.log(`Símbolos insertados: ${result.inserted}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
