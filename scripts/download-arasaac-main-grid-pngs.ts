/**
 * Descarga PNG 300px (primer resultado) por etiqueta única de MAIN_GRID_TEMPLATE.
 * Reintentos + consultas alternativas para minimizar fallos (429, búsquedas ambiguas).
 *
 * Uso: npm run arasaac:download-main-grid
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MAIN_GRID_TEMPLATE } from '../lib/data/defaultSymbols'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'arasaac-base')
const GEN_FILE = join(ROOT, 'lib', 'data', 'baseGridArasaacLocal.ts')

const LOCALE = 'es'
const BETWEEN_LABELS_MS = 550
const MAX_ATTEMPTS = 5
const FETCH_TIMEOUT_MS = 60_000

/** Búsquedas alternativas cuando la etiqueta literal devuelve 0 resultados o es demasiado ambigua. */
const SEARCH_TRY_LIST: Record<string, string[]> = {
  Y: ['conjunción y', 'letra y'],
  DE: ['preposición de', 'de'],
  CON: ['preposición con', 'con'],
  A: ['preposición a', 'letra a'],
  '¿Qué?': ['qué', 'qué interrogativo'],
  '¿Quién?': ['quién', 'quién interrogativo'],
  '¿Dónde?': ['dónde', 'donde interrogativo'],
  '¿Cuándo?': ['cuándo'],
  '¿Cómo?': ['cómo'],
  '¿Por qué?': ['por qué', 'porque'],
  Sí: ['sí afirmación', 'sí'],
  No: ['no negación', 'no'],
  Más: ['más cantidad', 'más'],
  UN: ['número uno', 'artículo un', 'uno número', 'número 1'],
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function uniqueMainGridLabels(): string[] {
  const set = new Set<string>()
  for (const row of MAIN_GRID_TEMPLATE) {
    for (const cell of row) {
      const s = String(cell ?? '').trim()
      if (s) set.add(s)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'))
}

async function fetchWithRetry(url: string, label: string, kind: string): Promise<Response> {
  let lastErr: Error | null = null
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
      clearTimeout(t)
      if (res.status === 429 || res.status === 503 || res.status === 502) {
        const wait = Math.min(8000, 1000 * 2 ** attempt)
        console.warn(`[${label}] ${kind} HTTP ${res.status}, reintento en ${wait}ms (${attempt}/${MAX_ATTEMPTS})`)
        await sleep(wait)
        continue
      }
      return res
    } catch (e) {
      clearTimeout(t)
      lastErr = e instanceof Error ? e : new Error(String(e))
      const wait = Math.min(8000, 1000 * 2 ** attempt)
      console.warn(`[${label}] ${kind} error: ${lastErr.message}, reintento en ${wait}ms`)
      await sleep(wait)
    }
  }
  throw lastErr ?? new Error(`fetch failed: ${label} ${kind}`)
}

async function searchFirstId(label: string): Promise<number | null> {
  const queries = [label, ...(SEARCH_TRY_LIST[label] ?? [])]
  const tried = new Set<string>()

  for (const q of queries) {
    const key = q.trim().toLowerCase()
    if (tried.has(key)) continue
    tried.add(key)

    const searchUrl = `https://api.arasaac.org/v1/pictograms/${LOCALE}/search/${encodeURIComponent(q)}`
    const res = await fetchWithRetry(searchUrl, label, `search "${q}"`)
    if (!res.ok) continue

    let data: unknown
    try {
      data = await res.json()
    } catch {
      continue
    }
    if (!Array.isArray(data) || data.length === 0) continue
    const id = (data[0] as { _id?: number })?._id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

async function downloadPng(id: number, label: string): Promise<Buffer> {
  const pngUrl = `https://static.arasaac.org/pictograms/${id}/${id}_300.png`
  const imgRes = await fetchWithRetry(pngUrl, label, 'png')
  if (!imgRes.ok) throw new Error(`png HTTP ${imgRes.status}`)
  return Buffer.from(await imgRes.arrayBuffer())
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const labels = uniqueMainGridLabels()
  const imageByLabel: Record<string, string> = {}
  const idByLabel: Record<string, number> = {}
  const failures: string[] = []

  for (const label of labels) {
    try {
      const id = await searchFirstId(label)
      if (id == null) {
        failures.push(`${label} (sin resultados tras variantes)`)
        continue
      }

      const buf = await downloadPng(id, label)
      const filename = `arasaac-${id}.png`
      const filePath = join(OUT_DIR, filename)
      if (!existsSync(filePath)) {
        writeFileSync(filePath, buf)
      }

      const publicPath = `/arasaac-base/${filename}`
      imageByLabel[label.toLowerCase()] = publicPath
      idByLabel[label.toLowerCase()] = id
      console.log(`OK ${label} -> ${id}`)
    } catch (e) {
      failures.push(`${label} (${e instanceof Error ? e.message : String(e)})`)
    }
    await sleep(BETWEEN_LABELS_MS)
  }

  const ts = `/**
 * Pictogramas ARASAAC del tablero base (etiquetas en MAIN_GRID_TEMPLATE), servidos desde /public/arasaac-base.
 * Licencia: CC BY-NC-SA (ARASAAC) — mantener atribución según términos oficiales.
 *
 * Generado por: npm run arasaac:download-main-grid
 * Fecha: ${new Date().toISOString()}
 */
export const BASE_GRID_ARASAAC_IMAGE_BY_LABEL: Record<string, string> = ${JSON.stringify(imageByLabel, null, 2)}

export const BASE_GRID_ARASAAC_ID_BY_LABEL: Record<string, number> = ${JSON.stringify(idByLabel, null, 2)}
`

  writeFileSync(GEN_FILE, ts, 'utf8')

  console.log(`\nEtiquetas: ${labels.length} | OK: ${Object.keys(imageByLabel).length}`)
  if (failures.length) {
    console.error('\nFallos:')
    for (const f of failures) console.error(' -', f)
    process.exit(1)
  }
}

main()
