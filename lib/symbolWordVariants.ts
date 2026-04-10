/**
 * Variantes de palabra por celda (hasta 4 textos; toque corto = predeterminada).
 * Opcional: imagen personalizada por ranura (data URL o URL).
 * Se persiste en Prisma como JSON; solo se guarda si hay al menos 2 textos no vacíos.
 */

export type WordVariantImageUrls = [string | null, string | null, string | null, string | null]

export type WordVariantsConfig = {
  enabled: true
  defaultIndex: number
  variants: [string, string, string, string]
  /** Imagen opcional por ranura (misma posición que `variants`). */
  variantImageUrls?: WordVariantImageUrls
}

export type WordVariantsEdit = {
  enabled: boolean
  defaultIndex: number
  variants: [string, string, string, string]
  /** En admin: cadena vacía = sin imagen (data URL permitida). */
  variantImageUrls: [string, string, string, string]
}

export const EMPTY_WORD_VARIANTS_EDIT: WordVariantsEdit = {
  enabled: false,
  defaultIndex: 0,
  variants: ['', '', '', ''],
  variantImageUrls: ['', '', '', ''],
}

function clampSlotIndex(i: number): number {
  if (!Number.isFinite(i)) return 0
  return Math.max(0, Math.min(3, Math.floor(i)))
}

function parseVariantImageUrls(raw: unknown): WordVariantImageUrls {
  const out: WordVariantImageUrls = [null, null, null, null]
  if (!Array.isArray(raw)) return out
  for (let i = 0; i < 4; i += 1) {
    const u = raw[i]
    if (typeof u === 'string' && u.trim().length > 0) out[i] = u.trim()
  }
  return out
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

  const urls = parseVariantImageUrls(o.variantImageUrls)
  const coerced: WordVariantImageUrls = [null, null, null, null]
  for (let i = 0; i < 4; i += 1) {
    if (slots[i].length > 0 && urls[i]) coerced[i] = urls[i]
  }

  const hasAnyImage = coerced.some((u) => u != null)
  return {
    enabled: true,
    defaultIndex,
    variants: slots,
    ...(hasAnyImage ? { variantImageUrls: coerced } : {}),
  }
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

export type VariantMenuEntry = { index: number; label: string; imageUrl: string | null }

/** Lista para menú radial en tablero (índice original + texto + imagen opcional). */
export function listVariantMenuEntries(cfg: WordVariantsConfig): VariantMenuEntry[] {
  const urls = cfg.variantImageUrls ?? ([null, null, null, null] as WordVariantImageUrls)
  return cfg.variants
    .map((text, index) => ({
      index,
      label: text.trim(),
      imageUrl: urls[index] ?? null,
    }))
    .filter((e) => e.label.length > 0)
}

export function symbolHasVariantMenu(cfg: WordVariantsConfig | undefined): boolean {
  if (!cfg) return false
  return listVariantMenuEntries(cfg).length >= 2
}

/** Convierte el estado del formulario admin en config válida para el tablero (o undefined). */
export function adminEditToMenuConfig(edit: WordVariantsEdit | undefined): WordVariantsConfig | undefined {
  if (!edit?.enabled) return undefined
  return normalizeWordVariantsInput({
    enabled: true,
    defaultIndex: edit.defaultIndex,
    variants: edit.variants,
    variantImageUrls: edit.variantImageUrls,
  }) ?? undefined
}

/** Texto que entra en la frase con toque corto (predeterminada). */
export function defaultPhraseLabel(symbolLabel: string, cfg: WordVariantsConfig | undefined): string {
  if (!cfg) return symbolLabel
  const t = cfg.variants[cfg.defaultIndex]?.trim()
  return t || symbolLabel
}
