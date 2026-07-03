/**
 * `prisma migrate deploy` con reintentos y URL de migración adecuada para Neon.
 *
 * P1002 (advisory lock timeout) suele deberse a:
 * - Usar el pooler de Neon (-pooler.) en migraciones (no soporta pg_advisory_lock).
 * - Builds concurrentes en Vercel compitiendo por el mismo lock.
 * - Cold start de la base de datos.
 *
 * Uso: node scripts/prisma-migrate-deploy.mjs
 */
import './load-env-database.mjs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const MAX_ATTEMPTS = 4
const BASE_DELAY_MS = 8000

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** URL directa para migraciones: DIRECT_URL > DATABASE_URL sin pooler Neon. */
function resolveMigrationDatabaseUrl() {
  const direct = process.env.DIRECT_URL?.trim()
  if (direct) return direct

  const url = process.env.DATABASE_URL?.trim()
  if (!url) return url

  // Neon pooler no admite advisory locks de Prisma migrate.
  if (url.includes('-pooler.')) {
    const directFromPooler = url.replace('-pooler.', '.')
    console.warn(
      '[migrate] DATABASE_URL usa pooler Neon; migrando con conexión directa derivada. ' +
        'Recomendado: definir DIRECT_URL en Vercel.',
    )
    return directFromPooler
  }

  return url
}

function runMigrateDeploy(migrationUrl) {
  return spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_URL: migrationUrl,
    },
  })
}

function isRetryable(output) {
  const text = `${output.stdout ?? ''}${output.stderr ?? ''}`
  return (
    text.includes('P1002') ||
    text.includes('advisory lock') ||
    text.includes('timed out') ||
    text.includes('Timed out')
  )
}

async function main() {
  const migrationUrl = resolveMigrationDatabaseUrl()
  if (!migrationUrl) {
    console.error('[migrate] Falta DATABASE_URL (o DIRECT_URL) para migrate deploy.')
    process.exit(1)
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      const delay = BASE_DELAY_MS * attempt
      console.warn(`[migrate] Reintento ${attempt}/${MAX_ATTEMPTS} en ${delay / 1000}s…`)
      await sleep(delay)
    }

    const result = runMigrateDeploy(migrationUrl)

    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)

    if ((result.status ?? 1) === 0) {
      process.exit(0)
    }

    if (attempt < MAX_ATTEMPTS && isRetryable(result)) {
      console.warn('[migrate] Timeout o advisory lock (P1002); reintentando…')
      continue
    }

    process.exit(result.status ?? 1)
  }

  process.exit(1)
}

main().catch(err => {
  console.error('[migrate] Error inesperado:', err)
  process.exit(1)
})
