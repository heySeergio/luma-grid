/**
 * Valida `prisma/data/phase3-staging.json` antes del import Fase 3.
 * Comprueba: array, duplicados (normalizedLemma+primaryPos), POS permitidos, campos mínimos.
 *
 * Uso: node scripts/validate-phase3-staging.mjs [ruta-json]
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeText } from './lib/lexemePhaseImportCore.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PATH = join(__dirname, '..', 'prisma', 'data', 'phase3-staging.json')

const ALLOWED_POS = new Set([
  'noun',
  'verb',
  'adj',
  'pronoun',
  'det',
  'prep',
  'adverb',
  'conj',
  'interj',
])

function main() {
  const path = process.argv[2] || DEFAULT_PATH
  if (!existsSync(path)) {
    console.error(`No existe el archivo: ${path}`)
    process.exit(1)
  }

  let data
  try {
    data = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    console.error('JSON inválido:', e.message)
    process.exit(1)
  }

  const list = Array.isArray(data) ? data : data.lexemes
  if (!Array.isArray(list)) {
    console.error('Se espera un array o { lexemes: [] }')
    process.exit(1)
  }

  const seen = new Map()
  const errors = []

  for (let i = 0; i < list.length; i += 1) {
    const row = list[i]
    const prefix = `[${i}]`
    if (!row || typeof row !== 'object') {
      errors.push(`${prefix} entrada no es objeto`)
      continue
    }
    if (!row.lemma || typeof row.lemma !== 'string' || !row.lemma.trim()) {
      errors.push(`${prefix} falta lemma`)
    }
    if (!row.primaryPos || typeof row.primaryPos !== 'string') {
      errors.push(`${prefix} falta primaryPos`)
    } else if (!ALLOWED_POS.has(row.primaryPos)) {
      errors.push(`${prefix} primaryPos no permitido: ${row.primaryPos}`)
    }

    if (row.lemma && row.primaryPos) {
      const key = `${normalizeText(row.lemma)}|${row.primaryPos}`
      if (seen.has(key)) {
        errors.push(`${prefix} duplicado con índice ${seen.get(key)}: ${key}`)
      } else {
        seen.set(key, i)
      }
    }
  }

  if (errors.length > 0) {
    console.error('Errores de validación:\n' + errors.join('\n'))
    process.exit(1)
  }

  console.log(`OK: ${list.length} entrada(s) en ${path}`)
}

main()
