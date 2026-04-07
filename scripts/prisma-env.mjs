/**
 * Ejecuta el CLI de Prisma con DATABASE_URL cargada desde .env y .env.local
 * (igual que scripts/load-env-database.mjs). Evita P1012 si la URL solo está en .env.local.
 *
 * Uso: node scripts/prisma-env.mjs generate
 *      node scripts/prisma-env.mjs migrate deploy
 *
 * EPERM al renombrar query_engine en Windows: otro proceso tiene el archivo abierto.
 * Cierra `npm run dev`, el servidor Next, antivirus en la carpeta del proyecto y reintenta.
 */
import './load-env-database.mjs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Uso: node scripts/prisma-env.mjs <argumentos de prisma...>')
  console.error('Ejemplo: node scripts/prisma-env.mjs generate')
  process.exit(1)
}

const r = spawnSync('npx', ['prisma', ...args], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(r.status ?? 1)
