/**
 * Variantes de palabra por celda (hasta 4 textos; toque corto = predeterminada).
 * Se persiste en Prisma como JSON; solo se guarda si hay al menos 2 textos no vacíos.
 */

export type WordVariantsConfig = {
  enabled: true
  defaultIndex: number
  variants: [string, string, string, string]
}

export type WordVariantsEdit = {
  enabled: boolean
  defaultIndex: number
  variants: [string, string, string, string]
}

export const EMPTY_WORD_VARIANTS_EDIT: WordVariantsEdit = {
  enabled: false,
  defaultIndex: 0,
  variants: ['', '', '', ''],
}

function clampSlotIndex(i: number): number {
  if (!Number.isFinite(i)) return 0
  return Math.max(0, Math.min(3, Math.floor(i)))
}

/** Normaliza entrada (admin o DB) a forma persistible; null = no guardar / vacío. */
export function normalizeWordVariantsInput(raw: unknown): WordVariantsConfig | null {
  if (raw == null || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const enabled = Boolean(o.enabled)
  if (!enabled) return null

  const variantArr: unknown[] = Array.isArray(o.variants) ? o.variants : []
  const slots: [string, string, string, string] = ['', '', '', '']
  for (let i = 0; i < 4; i += 1) {
    const v = variantArr[i]
    slots[i] = typeof v === 'string' ? v.trim() : ''
  }
  const nonEmpty = slots.filter((s) => s.length > 0)
  if (nonEmpty.length < 2) return null

  let defaultIndex = clampSlotIndex(typeof o.defaultIndex === 'number' ? o.defaultIndex : Number(o.defaultIndex))
  if (!slots[defaultIndex]) {
    const first = slots.findIndex((s) => s.length > 0)
    defaultIndex = first >= 0 ? first : 0
  }

  return { enabled: true, defaultIndex, variants: slots }
}

/** Para comparar payload admin vs fila DB. */
export function wordVariantsCanonical(raw: unknown): string {
  const n = normalizeWordVariantsInput(raw)
  return n ? JSON.stringify(n) : ''
}

export function parseWordVariantsForClient(raw: unknown): WordVariantsConfig | undefined {
  const n = normalizeWordVariantsInput(raw)
  return n ?? undefined
}

/** Lista para menú en tablero (índice original + texto). */
export function listVariantMenuEntries(cfg: WordVariantsConfig): { index: number; label: string }[] {
  return cfg.variants
    .map((text, index) => ({ index, label: text.trim() }))
    .filter((e) => e.label.length > 0)
}

export function symbolHasVariantMenu(cfg: WordVariantsConfig | undefined): boolean {
  if (!cfg) return false
  return listVariantMenuEntries(cfg).length >= 2
}

/** Convierte el estado del formulario admin en config válida para el tablero (o undefined). */
export function adminEditToMenuConfig(edit: WordVariantsEdit | undefined): WordVariantsConfig | undefined {
  if (!edit?.enabled) return undefined
  return normalizeWordVariantsInput(edit) ?? undefined
}

/** Texto que entra en la frase con toque corto (predeterminada). */
export function defaultPhraseLabel(symbolLabel: string, cfg: WordVariantsConfig | undefined): string {
  if (!cfg) return symbolLabel
  const t = cfg.variants[cfg.defaultIndex]?.trim()
  return t || symbolLabel
}
