/**
 * Batería Fase 1 (~50 etiquetas): prisma/data/phase1-detection-battery.json
 * Misma lógica que scripts/test-lexicon-detection.mjs (consulta Prisma).
 *
 * Uso: node scripts/test-phase1-battery.mjs
 */

import './load-env-database.mjs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PrismaClient } from '@prisma/client'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

const DIACRITIC_REGEX = /[\u0300-\u036f]/g

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function stripDiacritics(value) {
  return value.normalize('NFD').replace(DIACRITIC_REGEX, '')
}

function normalizeText(value) {
  return collapseWhitespace(value).toLowerCase()
}

function normalizeLooseText(value) {
  return stripDiacritics(normalizeText(value))
}

function stripOuterPunctuation(value) {
  return value
    .replace(/^[\s\u00A0]*[¿¡]+/, '')
    .replace(/[?!.,;:…]+[\s\u00A0]*$/, '')
    .trim()
}

async function detectForLabel(label) {
  const stripped = stripOuterPunctuation(label)
  const normalizedLabel = normalizeText(stripped)
  const normalizedLooseLabel = normalizeLooseText(stripped)

  if (!normalizedLabel) {
    return { method: 'unknown', lemma: null }
  }

  const searchValues = normalizedLooseLabel !== normalizedLabel
    ? [normalizedLabel, normalizedLooseLabel]
    : [normalizedLabel]

  const aliasMatches = await prisma.lexemeAlias.findMany({
    where: { normalizedAlias: { in: searchValues } },
    include: { lexeme: { select: { lemma: true } } },
    take: 1,
  })
  if (aliasMatches[0]) {
    return { method: 'alias', lemma: aliasMatches[0].lexeme.lemma }
  }

  const formMatches = await prisma.lexemeForm.findMany({
    where: { normalizedSurface: { in: searchValues } },
    include: { lexeme: { select: { lemma: true } } },
    take: 1,
  })
  if (formMatches[0]) {
    return { method: 'form', lemma: formMatches[0].lexeme.lemma }
  }

  const lemmaMatches = await prisma.lexeme.findMany({
    where: { normalizedLemma: { in: searchValues } },
    select: { lemma: true },
    take: 1,
  })
  if (lemmaMatches[0]) {
    return { method: 'lemma', lemma: lemmaMatches[0].lemma }
  }

  if (
    normalizedLabel.endsWith('ar') ||
    normalizedLabel.endsWith('er') ||
    normalizedLabel.endsWith('ir')
  ) {
    return { method: 'heuristic', lemma: normalizedLabel }
  }
  if (normalizedLabel.endsWith('mente')) {
    return { method: 'heuristic', lemma: normalizedLabel }
  }

  return { method: 'unknown', lemma: null }
}

async function main() {
  const path = join(__dirname, '..', 'prisma', 'data', 'phase1-detection-battery.json')
  const { cases } = JSON.parse(readFileSync(path, 'utf8'))

  let failed = 0
  let ok = 0

  for (const testCase of cases) {
    const result = await detectForLabel(testCase.label)

    let pass = false
    if (testCase.expectUnknown) {
      pass = result.method === 'unknown' && result.lemma === null
    } else if (testCase.expectedLemma != null) {
      pass = result.lemma === testCase.expectedLemma
    } else {
      pass = result.lemma === null
    }

    if (!pass) {
      failed += 1
      console.error(
        `[FAIL] "${testCase.label}" -> lemma="${result.lemma}" method="${result.method}" (esperado: ${testCase.expectedLemma ?? 'null/unknown'})`,
      )
    } else {
      ok += 1
      console.log(`[OK]   "${testCase.label}" -> lemma="${result.lemma}" method="${result.method}"`)
    }
  }

  console.log(`\nResumen: ${ok} OK, ${failed} fallos de ${cases.length} casos.`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error('Error en batería Fase 1:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
