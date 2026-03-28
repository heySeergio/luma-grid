import { PrismaClient } from '@prisma/client'

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

const TEST_CASES = [
  { label: '¿Qué?', expectedLemma: 'qué' },
  { label: 'Quiero', expectedLemma: 'querer' },
  { label: 'COMO', expectedLemma: 'comer' },
  { label: 'aqui', expectedLemma: 'aquí' },
  { label: 'Mami', expectedLemma: 'mamá' },
  { label: 'Papi', expectedLemma: 'papá' },
  { label: 'rápidamente', expectedMethod: 'heuristic' },
]

async function main() {
  let failed = 0

  for (const testCase of TEST_CASES) {
    const result = await detectForLabel(testCase.label)
    const lemmaOk = testCase.expectedLemma ? result.lemma === testCase.expectedLemma : true
    const methodOk = testCase.expectedMethod ? result.method === testCase.expectedMethod : true
    const pass = lemmaOk && methodOk

    if (!pass) {
      failed += 1
      console.error(
        `[FAIL] "${testCase.label}" -> lemma="${result.lemma}" method="${result.method}"`,
      )
      if (testCase.expectedLemma) {
        console.error(`       Esperado lemma="${testCase.expectedLemma}"`)
      }
      if (testCase.expectedMethod) {
        console.error(`       Esperado method="${testCase.expectedMethod}"`)
      }
    } else {
      console.log(`[OK]   "${testCase.label}" -> lemma="${result.lemma}" method="${result.method}"`)
    }
  }

  if (failed > 0) {
    console.error(`\nResultado: ${failed} fallo(s) de ${TEST_CASES.length} caso(s).`)
    process.exitCode = 1
    return
  }

  console.log(`\nResultado: ${TEST_CASES.length} caso(s) verificados correctamente.`)
}

main()
  .catch((error) => {
    console.error('Error ejecutando pruebas de detección léxica:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
