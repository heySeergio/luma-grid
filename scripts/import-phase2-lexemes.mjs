/**
 * Import idempotente Fase 2: lemas adicionales (lotes temáticos) con source=phase2.
 * No sobrescribe lemas existentes (Fase 1, seed, etc.).
 *
 * Uso: node scripts/import-phase2-lexemes.mjs
 */

import './load-env-database.mjs'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import {
  PHASE2_ALIAS_SUPPLEMENTS,
  PHASE2_BULK_ADJECTIVES,
  PHASE2_BULK_NOUNS,
  PHASE2_BULK_VERBS,
} from './phase2-bulk-data.mjs'
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
const SOURCE = 'phase2'
const EXTRA_JSON = join(__dirname, '..', 'prisma', 'data', 'phase2-extra.json')

/** Prioridad algo menor que Fase 1 (núcleo medio / AAC general). */
const P_NOUN = 44
const FS_NOUN = 0.54
const P_VERB = 52
const FS_VERB = 0.58
const P_ADJ = 48
const FS_ADJ = 0.55

function loadExtraEntries() {
  if (!existsSync(EXTRA_JSON)) return []
  try {
    const raw = readFileSync(EXTRA_JSON, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : data.lexemes ?? []
  } catch (e) {
    console.warn('[phase2] No se pudo leer phase2-extra.json:', e.message)
    return []
  }
}

async function main() {
  const seen = new Set()
  const entries = []

  for (const [lemma, g, layer] of PHASE2_BULK_NOUNS) {
    const k = dedupeKey(lemma, 'noun')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(nounEntry(lemma, g, layer, SOURCE, P_NOUN, FS_NOUN))
  }

  for (const row of PHASE2_BULK_VERBS) {
    const [lemma, vg, irr, trans] = row
    const k = dedupeKey(lemma, 'verb')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(verbEntry(lemma, vg, irr, trans, SOURCE, P_VERB, FS_VERB))
  }

  for (const [lemma, layer] of PHASE2_BULK_ADJECTIVES) {
    const k = dedupeKey(lemma, 'adj')
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(adjEntry(lemma, layer, SOURCE, P_ADJ, FS_ADJ))
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

  for (const sup of PHASE2_ALIAS_SUPPLEMENTS) {
    await importAliasSupplement(prisma, sup, '[phase2]')
  }

  console.log(
    `Fase 2: ${created} lemas nuevos, ${skipped} ya existían (omitidos), alias suplementarios aplicados.`,
  )
}

main()
  .catch((err) => {
    console.error('Error importando Fase 2:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
