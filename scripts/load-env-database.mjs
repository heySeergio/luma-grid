/**
 * Carga DATABASE_URL desde .env y luego .env.local (sin dependencia dotenv).
 * Importar antes de instanciar Prisma en scripts Node.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function applyEnvFile(relPath, overwrite) {
  const p = join(root, relPath)
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (overwrite || process.env[key] === undefined) {
      process.env[key] = val
    }
  }
}

applyEnvFile('.env', false)
applyEnvFile('.env.local', true)
