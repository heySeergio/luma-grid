/**
 * Extrae etiquetas únicas de la plantilla demo (lib/data/defaultSymbols.ts).
 * Salida: prisma/data/demo-label-candidates.json
 *
 * Uso: node scripts/extract-demo-labels.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = join(__dirname, '..', 'lib', 'data', 'defaultSymbols.ts')
const OUT_DIR = join(__dirname, '..', 'prisma', 'data')
const OUT = join(OUT_DIR, 'demo-label-candidates.json')

function extractLabels(source) {
  const labels = new Set()
  const re = /label:\s*['"]([^'"]+)['"]/g
  let m
  while ((m = re.exec(source)) !== null) {
    if (m[1].trim()) labels.add(m[1].trim())
  }
  return [...labels].sort((a, b) => a.localeCompare(b, 'es'))
}

function main() {
  const source = readFileSync(SRC, 'utf8')
  const labels = extractLabels(source)
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        sourceFile: 'lib/data/defaultSymbols.ts',
        extractedAt: new Date().toISOString(),
        count: labels.length,
        labels,
      },
      null,
      2,
    ),
    'utf8',
  )
  console.log(`Extraídas ${labels.length} etiquetas únicas -> ${OUT}`)
}

main()
