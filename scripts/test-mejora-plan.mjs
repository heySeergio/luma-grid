/**
 * Verificación interna del plan en mejora.md (artefactos, JSON, núcleo de import, Prisma).
 *
 * - Sin BD: comprueba rutas, parsea datos, valida phase3 staging, ejecuta `prisma validate`,
 *   comprobaciones sobre `lexemePhaseImportCore` y coherencia factor tier ↔ predicción.
 * - Con DATABASE_URL: conexión, consulta mínima a `lexemes` (y `lexemeTier` si existe).
 * - `--full` + DATABASE_URL: encadena `test-lexicon-regression.mjs` (detección + batería Fase 1).
 *
 * Uso:
 *   node scripts/test-mejora-plan.mjs
 *   node scripts/test-mejora-plan.mjs --full
 *   MEJORA_SKIP_DB=1 node scripts/test-mejora-plan.mjs   # forzar solo estáticas
 */

import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const fullMode = process.argv.includes('--full')
const skipDb = process.env.MEJORA_SKIP_DB === '1'

/** Rutas relativas al repo documentadas en mejora.md */
const REQUIRED_FILES = [
  'mejora.md',
  'scripts/load-env-database.mjs',
  'scripts/prisma-env.mjs',
  'scripts/lib/lexemePhaseImportCore.mjs',
  'scripts/extract-demo-labels.mjs',
  'scripts/phase1-bulk-data.mjs',
  'scripts/import-phase1-lexemes.mjs',
  'scripts/generate-phase2-bulk-data.mjs',
  'scripts/phase2-bulk-data.mjs',
  'scripts/import-phase2-lexemes.mjs',
  'scripts/test-lexicon-detection.mjs',
  'scripts/test-phase1-battery.mjs',
  'scripts/test-lexicon-regression.mjs',
  'scripts/validate-phase3-staging.mjs',
  'scripts/import-phase3-lexemes.mjs',
  'prisma/data/phase1-extra.json',
  'prisma/data/phase1-detection-battery.json',
  'prisma/data/phase2-extra.json',
  'prisma/data/phase3-staging.json',
  'prisma/data/phase3-extra.json',
  'lib/lexicon/lexemeTier.ts',
  'app/actions/predictions.ts',
  'app/api/vocabulary/route.ts',
]

function mustExist(rel) {
  const p = join(root, rel)
  assert.ok(existsSync(p), `Falta artefacto del plan: ${rel}`)
}

function assertParsableJsonArray(rel, minLength = 0) {
  const p = join(root, rel)
  const raw = JSON.parse(readFileSync(p, 'utf8'))
  const arr = Array.isArray(raw) ? raw : raw.lexemes
  assert.ok(Array.isArray(arr), `${rel}: se esperaba array o { lexemes: [] }`)
  assert.ok(arr.length >= minLength, `${rel}: se esperaban al menos ${minLength} entradas, hay ${arr.length}`)
}

/** Batería Fase 1: { cases: [...] } o array plano */
function assertDetectionBattery(rel, minCases = 1) {
  const p = join(root, rel)
  const raw = JSON.parse(readFileSync(p, 'utf8'))
  const cases = Array.isArray(raw) ? raw : raw.cases
  assert.ok(Array.isArray(cases), `${rel}: se esperaba array o { cases: [] }`)
  assert.ok(cases.length >= minCases, `${rel}: al menos ${minCases} casos, hay ${cases.length}`)
  for (let i = 0; i < Math.min(cases.length, 3); i += 1) {
    assert.ok(cases[i]?.label != null, `${rel}[${i}]: falta label`)
  }
}

function runNodeScript(relScript, args = []) {
  const scriptPath = join(root, relScript)
  const r = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })
  assert.equal(
    r.status,
    0,
    `${relScript} falló (exit ${r.status})\n${r.stderr || ''}${r.stdout || ''}`,
  )
}

async function testTierFactorCoherence() {
  const tierPath = join(root, 'lib/lexicon/lexemeTier.ts')
  const predPath = join(root, 'app/actions/predictions.ts')
  const tierSrc = readFileSync(tierPath, 'utf8')
  const predSrc = readFileSync(predPath, 'utf8')

  const m = tierSrc.match(/EXTENDED_TIER_PREDICTION_FACTOR\s*=\s*([0-9.]+)/)
  assert.ok(m, 'lexemeTier.ts debe definir EXTENDED_TIER_PREDICTION_FACTOR')
  assert.ok(
    predSrc.includes('EXTENDED_TIER_PREDICTION_FACTOR'),
    'predictions.ts debe importar EXTENDED_TIER_PREDICTION_FACTOR',
  )
  assert.ok(
    predSrc.includes('lexemeTier') && predSrc.includes('extended'),
    'predictions.ts debe usar lexemeTier extended',
  )
}

async function testCoreHelpers() {
  const core = await import('./lib/lexemePhaseImportCore.mjs')
  assert.equal(core.normalizeText('  Leche '), 'leche')
  assert.equal(core.dedupeKey('Casa', 'noun'), 'casa|noun')
  const n = core.nounEntry('prueba', 'm', null, 'phase_test', 40, 0.5)
  assert.equal(n.primaryPos, 'noun')
  assert.equal(n.source, 'phase_test')
  assert.ok(Array.isArray(n.forms))
}

async function testDbOptional() {
  if (skipDb) {
    console.log('[mejora-plan] MEJORA_SKIP_DB=1 — omitiendo pruebas de BD.')
    return
  }

  await import('./load-env-database.mjs')
  if (!process.env.DATABASE_URL) {
    console.log('[mejora-plan] Sin DATABASE_URL — omitiendo conexión y regresión léxica.')
    return
  }

  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    const n = await prisma.lexeme.count()
    assert.ok(typeof n === 'number', 'count lexemes')

    let tierOk = false
    try {
      await prisma.lexeme.findFirst({ select: { lexemeTier: true } })
      tierOk = true
    } catch {
      console.warn(
        '[mejora-plan] Aviso: columna lexeme_tier no accesible — ejecuta prisma migrate deploy.',
      )
    }
    if (tierOk) {
      const tiers = await prisma.lexeme.groupBy({
        by: ['lexemeTier'],
        _count: { _all: true },
      })
      assert.ok(Array.isArray(tiers))
    }

    if (fullMode) {
      console.log('[mejora-plan] Modo --full: ejecutando test-lexicon-regression.mjs …')
      runNodeScript('scripts/test-lexicon-regression.mjs')
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('[mejora-plan] Comprobando artefactos y datos…')

  await import('./load-env-database.mjs')

  for (const rel of REQUIRED_FILES) {
    mustExist(rel)
  }

  assertDetectionBattery('prisma/data/phase1-detection-battery.json', 1)
  assertParsableJsonArray('prisma/data/phase1-extra.json', 0)
  assertParsableJsonArray('prisma/data/phase2-extra.json', 0)
  assertParsableJsonArray('prisma/data/phase3-staging.json', 0)
  assertParsableJsonArray('prisma/data/phase3-extra.json', 0)

  runNodeScript('scripts/validate-phase3-staging.mjs')
  runNodeScript('scripts/prisma-env.mjs', ['validate'])

  await testTierFactorCoherence()
  await testCoreHelpers()

  console.log('[mejora-plan] Prisma schema y núcleo de import OK.')

  await testDbOptional()

  console.log('[mejora-plan] Todas las comprobaciones pasaron.')
}

main().catch((err) => {
  console.error('[mejora-plan] FALLÓ:', err)
  process.exit(1)
})
