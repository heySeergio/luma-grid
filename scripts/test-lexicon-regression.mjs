/**
 * Regresión léxica: detección base + batería Fase 1.
 * Uso: node scripts/test-lexicon-regression.mjs
 */
import './load-env-database.mjs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const scripts = [
  'test-lexicon-detection.mjs',
  'test-phase1-battery.mjs',
]

for (const name of scripts) {
  const r = spawnSync(process.execPath, [join(__dirname, name)], {
    stdio: 'inherit',
    env: process.env,
  })
  if (r.status !== 0) {
    process.exit(r.status ?? 1)
  }
}

console.log('\nRegresión léxica: todas las pruebas pasaron.')
