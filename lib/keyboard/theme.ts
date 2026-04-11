import type { CSSProperties } from 'react'
import { isAllowedKeyColorId } from '@/lib/keyboard/layout'

/**
 * Tema visual del teclado en /tablero (solo colores; no cambia disposición ni letras).
 * Valores hex (#rrggbb); campos opcionales: sin valor se usa el estilo por defecto del tema de la app.
 */
export type KeyboardThemeColors = {
  /** Fondo del área del teclado */
  areaBg?: string
  /** Fondo de las teclas */
  keyBg?: string
  /** Borde de las teclas */
  keyBorder?: string
  /** Texto de las teclas */
  keyText?: string
  /** Fondo de la barra donde se escribe */
  inputBg?: string
  /** Borde de la barra donde se escribe */
  inputBorder?: string
  /** Texto de la barra donde se escribe */
  inputText?: string
  /** Chips de predicción: fondo */
  predictionBg?: string
  /** Chips de predicción: texto */
  predictionText?: string
  /** Anula solo el color de fondo de teclas concretas (ids en `lib/keyboard/layout`). */
  keyColors?: Record<string, string>
  /** Anula solo el color del texto de teclas concretas (mismos ids que `keyColors`). */
  keyTextColors?: Record<string, string>
}

/** Solo colores «globales» (no mapas por tecla). */
export type KeyboardGlobalThemeKey = Exclude<keyof KeyboardThemeColors, 'keyColors' | 'keyTextColors'>

export const KEYBOARD_THEME_LABELS: Record<KeyboardGlobalThemeKey, string> = {
  areaBg: 'Fondo del teclado',
  keyBg: 'Teclas — fondo',
  keyBorder: 'Teclas — borde',
  keyText: 'Teclas — texto',
  inputBg: 'Barra de escritura — fondo',
  inputBorder: 'Barra de escritura — borde',
  inputText: 'Barra de escritura — texto',
  predictionBg: 'Sugerencias — fondo',
  predictionText: 'Sugerencias — texto',
}

export const KEYBOARD_THEME_KEYS = Object.keys(KEYBOARD_THEME_LABELS) as KeyboardGlobalThemeKey[]

function parseKeyColorMap(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(v)) continue
    if (!isAllowedKeyColorId(k)) continue
    out[k] = v
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function parseKeyboardTheme(raw: unknown): KeyboardThemeColors | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const out: KeyboardThemeColors = {}
  for (const key of KEYBOARD_THEME_KEYS) {
    const v = o[key]
    if (typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v)) {
      out[key] = v
    }
  }
  const kc = parseKeyColorMap(o.keyColors)
  if (kc) out.keyColors = kc
  const ktc = parseKeyColorMap(o.keyTextColors)
  if (ktc) out.keyTextColors = ktc
  return Object.keys(out).length > 0 ? out : null
}

export function sanitizeKeyboardThemeInput(input: unknown): KeyboardThemeColors {
  const parsed = parseKeyboardTheme(input)
  return parsed ?? {}
}

/** True si no hay ningún color definido (ni globales ni por tecla). */
export function isKeyboardThemeEmpty(theme: KeyboardThemeColors): boolean {
  for (const key of KEYBOARD_THEME_KEYS) {
    if (theme[key]) return false
  }
  if (theme.keyColors && Object.keys(theme.keyColors).length > 0) return false
  if (theme.keyTextColors && Object.keys(theme.keyTextColors).length > 0) return false
  return true
}

/** Convierte el tema en variables CSS para `.keyboard-theme-scope`. */
export function keyboardThemeToCssVars(theme: KeyboardThemeColors | null | undefined): CSSProperties {
  if (!theme) return {}
  const e: Record<string, string> = {}
  const set = (cssVar: string, val?: string) => {
    if (val && /^#[0-9A-Fa-f]{6}$/.test(val)) e[cssVar] = val
  }
  set('--kb-area-bg', theme.areaBg)
  set('--kb-key-bg', theme.keyBg)
  set('--kb-key-border', theme.keyBorder)
  set('--kb-key-text', theme.keyText)
  set('--kb-input-bg', theme.inputBg)
  set('--kb-input-border', theme.inputBorder)
  set('--kb-input-text', theme.inputText)
  set('--kb-pred-bg', theme.predictionBg)
  set('--kb-pred-text', theme.predictionText)
  return e as CSSProperties
}
