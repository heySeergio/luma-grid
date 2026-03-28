/**
 * Ejecuta `prisma migrate deploy` usando DATABASE_URL de .env.local
 * (Prisma solo carga .env por defecto; aquí forzamos la URL de Neon).
 */
import { readFileSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envLocal = join(root, '.env.local')

if (!existsSync(envLocal)) {
  console.error('No se encontró .env.local (necesita DATABASE_URL).')
  process.exit(1)
}

for (const line of readFileSync(envLocal, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  if (key !== 'DATABASE_URL') continue
  let val = trimmed.slice(eq + 1).trim()
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1)
  }
  process.env.DATABASE_URL = val
  break
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definido en .env.local.')
  process.exit(1)
}

const r = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  cwd: root,
  shell: true,
  env: process.env,
})

process.exit(r.status ?? 1)
