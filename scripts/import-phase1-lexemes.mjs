/**
 * Import idempotente Fase 1: crea lemas nuevos con source=phase1 sin sobrescribir
 * lemas ya existentes (p. ej. seed con conjugaciones completas).
 *
 * Uso: node scripts/import-phase1-lexemes.mjs
 */

import './load-env-database.mjs'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import {
  PHASE1_ALIAS_SUPPLEMENTS,
  PHASE1_BULK_ADJECTIVES,
  PHASE1_BULK_NOUNS,
  PHASE1_BULK_VERBS,
} from './phase1-bulk-data.mjs'
import {
  adjEntry,
  dedupeKey,
  importAliasSupplement,
  importLexemeIfMissing,
  makeSurface,
  nounEntry,
  verbEntry,
} from './lib/lexemePhaseImportCore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()
const SOURCE = 'phase1'
const EXTRA_JSON = join(__dirname, '..', 'prisma', 'data', 'phase1-extra.json')

function loadExtraEntries() {
  if (!existsSync(EXTRA_JSON)) return []
  try {
    const raw = readFileSync(EXTRA_JSON, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : data.lexemes ?? []
  } catch (e) {
    console.warn('[phase1] No se pudo leer phase1-extra.json:', e.message)
    return []
  }
}

async function main() {
  const seen = new Set()
  const entries = []

  for (const [lemma, g, layer] of PHASE1_BULK_NOUNS) {
    const k = dedupeKey(lemma, 'noun')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(nounEntry(lemma, g, layer, SOURCE))
  }

  for (const row of PHASE1_BULK_VERBS) {
    const [lemma, vg, irr, trans] = row
    const k = dedupeKey(lemma, 'verb')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(verbEntry(lemma, vg, irr, trans, SOURCE))
  }

  for (const [lemma, layer] of PHASE1_BULK_ADJECTIVES) {
    const k = dedupeKey(lemma, 'adj')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(adjEntry(lemma, layer, SOURCE))
  }

  for (const raw of loadExtraEntries()) {
    if (!raw?.lemma || !raw?.primaryPos) continue
    const k = dedupeKey(raw.lemma, raw.primaryPos)
    if (seen.has(k)) continue
    seen.add(k)
    const forms = raw.forms?.length
      ? raw.forms.map((f) =>
          typeof f.surface === 'string' ? makeSurface(f.surface, f) : f,
        )
      : undefined
    entries.push({
      ...raw,
      source: SOURCE,
      forms,
    })
  }

  let created = 0
  let skipped = 0

  for (const entry of entries) {
    const r = await importLexemeIfMissing(prisma, entry)
    if (r.created) created += 1
    else skipped += 1
  }

  for (const sup of PHASE1_ALIAS_SUPPLEMENTS) {
    await importAliasSupplement(prisma, sup, '[phase1]')
  }

  console.log(
    `Fase 1: ${created} lemas nuevos, ${skipped} ya existían (omitidos), alias suplementarios aplicados.`,
  )
}

main()
  .catch((err) => {
    console.error('Error importando Fase 1:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
