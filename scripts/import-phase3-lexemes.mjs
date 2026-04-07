/**
 * Import idempotente Fase 3: léxico ampliado (tier extended), source phase3.
 * Lee listas validadas: prisma/data/phase3-staging.json (+ phase3-extra.json opcional).
 * Prioridad y frecuencia inferiores a Fase 2; predicción aplica factor menor a tier extended.
 *
 * Previo: node scripts/validate-phase3-staging.mjs
 * Uso: node scripts/import-phase3-lexemes.mjs
 */

import './load-env-database.mjs'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient } from '@prisma/client'
import {
  adjEntry,
  dedupeKey,
  importLexemeIfMissing,
  makeSurface,
  nounEntry,
  verbEntry,
} from './lib/lexemePhaseImportCore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()
const SOURCE = 'phase3'
const STAGING_JSON = join(__dirname, '..', 'prisma', 'data', 'phase3-staging.json')
const EXTRA_JSON = join(__dirname, '..', 'prisma', 'data', 'phase3-extra.json')

/** Inferior a Fase 2: volumen alto, menor peso en predicción. */
const P_NOUN = 36
const FS_NOUN = 0.46
const P_VERB = 44
const FS_VERB = 0.5
const P_ADJ = 40
const FS_ADJ = 0.48

function asExtended(entry) {
  return {
    ...entry,
    source: SOURCE,
    lexemeTier: 'extended',
    isCore: false,
  }
}

function loadJsonArray(path) {
  if (!existsSync(path)) return []
  try {
    const raw = readFileSync(path, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : data.lexemes ?? []
  } catch (e) {
    console.warn(`[phase3] No se pudo leer ${path}:`, e.message)
    return []
  }
}

function entryFromStagingRow(raw) {
  if (!raw?.lemma || !raw.primaryPos) return null
  const pos = raw.primaryPos
  if (pos === 'noun') {
    const g = raw.gender === 'f' || raw.gender === 'fem' ? 'f' : 'm'
    const layer = raw.semanticLayer ?? null
    return asExtended(nounEntry(raw.lemma, g, layer, SOURCE, P_NOUN, FS_NOUN))
  }
  if (pos === 'verb') {
    return asExtended(
      verbEntry(
        raw.lemma,
        raw.verbGroup ?? 'first',
        Boolean(raw.isIrregular),
        raw.transitivity ?? 'amb',
        SOURCE,
        P_VERB,
        FS_VERB,
      ),
    )
  }
  if (pos === 'adj') {
    return asExtended(adjEntry(raw.lemma, raw.semanticLayer ?? 'other', SOURCE, P_ADJ, FS_ADJ))
  }
  return asExtended({
    lemma: raw.lemma,
    primaryPos: pos,
    secondaryPos: raw.secondaryPos ?? null,
    gender: raw.gender ?? null,
    numberBehavior: raw.numberBehavior ?? null,
    verbGroup: raw.verbGroup ?? null,
    isIrregular: raw.isIrregular ?? false,
    isReflexive: raw.isReflexive ?? false,
    transitivity: raw.transitivity ?? null,
    frequencyScore: raw.frequencyScore ?? FS_NOUN,
    aacPriority: raw.aacPriority ?? P_NOUN,
    semanticLayer: raw.semanticLayer ?? 'other',
    forms: raw.forms?.length
      ? raw.forms.map((f) =>
          typeof f.surface === 'string' ? makeSurface(f.surface, f) : f,
        )
      : undefined,
    aliases: raw.aliases,
  })
}

async function main() {
  const seen = new Set()
  const entries = []

  for (const raw of loadJsonArray(STAGING_JSON)) {
    const e = entryFromStagingRow(raw)
    if (!e) continue
    const k = dedupeKey(e.lemma, e.primaryPos)
    if (seen.has(k)) continue
    seen.add(k)
    entries.push(e)
  }

  for (const raw of loadJsonArray(EXTRA_JSON)) {
    if (!raw?.lemma || !raw.primaryPos) continue
    const k = dedupeKey(raw.lemma, raw.primaryPos)
    if (seen.has(k)) continue
    seen.add(k)
    const forms = raw.forms?.length
      ? raw.forms.map((f) =>
          typeof f.surface === 'string' ? makeSurface(f.surface, f) : f,
        )
      : undefined
    entries.push(
      asExtended({
        ...raw,
        source: SOURCE,
        forms,
      }),
    )
  }

  let created = 0
  let skipped = 0

  for (const entry of entries) {
    const r = await importLexemeIfMissing(prisma, entry)
    if (r.created) created += 1
    else skipped += 1
  }

  console.log(
    `Fase 3: ${created} lemas nuevos, ${skipped} ya existían (omitidos). Tier extended + source ${SOURCE}.`,
  )
}

main()
  .catch((err) => {
    console.error('Error importando Fase 3:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
