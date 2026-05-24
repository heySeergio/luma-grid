import './load-env-database.mjs'
import { PrismaClient } from '@prisma/client'
import { detectLexemeForLabel } from '../lib/lexicon/detect.ts'

const prisma = new PrismaClient()

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
  if (!process.env.DATABASE_URL?.trim()) {
    console.log('DATABASE_URL no configurada; se omiten pruebas de detección léxica.')
    return
  }

  const lexemeCount = await prisma.lexeme.count()
  if (lexemeCount === 0) {
    console.log('Catálogo léxico vacío; se omiten pruebas de regresión (ejecuta seed:lexicon).')
    return
  }

  let failed = 0

  for (const testCase of TEST_CASES) {
    const result = await detectLexemeForLabel(testCase.label)
    const lemma = result.detectedLemma
    const method = result.method
    const lemmaOk = testCase.expectedLemma ? lemma === testCase.expectedLemma : true
    const methodOk = testCase.expectedMethod ? method === testCase.expectedMethod : true
    const pass = lemmaOk && methodOk

    if (!pass) {
      failed += 1
      console.error(`[FAIL] "${testCase.label}" -> lemma="${lemma}" method="${method}"`)
      if (testCase.expectedLemma) {
        console.error(`       Esperado lemma="${testCase.expectedLemma}"`)
      }
      if (testCase.expectedMethod) {
        console.error(`       Esperado method="${testCase.expectedMethod}"`)
      }
    } else {
      console.log(`[OK]   "${testCase.label}" -> lemma="${lemma}" method="${method}"`)
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
