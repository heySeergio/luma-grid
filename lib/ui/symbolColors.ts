export const DEFAULT_SYMBOL_COLOR = 'preset:surface'
export const DEFAULT_FOLDER_COLOR = 'preset:folder'
export const DEFAULT_TEMPLATE_COLOR = 'preset:template'
export const DEFAULT_FIXED_CELL_COLOR = 'preset:fixed'

export const PRESET_SYMBOL_COLORS = [
  { value: 'preset:surface', cssVar: 'var(--symbol-color-surface)' },
  { value: 'preset:sky', cssVar: 'var(--symbol-color-sky)' },
  { value: 'preset:green', cssVar: 'var(--symbol-color-green)' },
  { value: 'preset:yellow', cssVar: 'var(--symbol-color-yellow)' },
  { value: 'preset:violet', cssVar: 'var(--symbol-color-violet)' },
  { value: 'preset:rose', cssVar: 'var(--symbol-color-rose)' },
  { value: 'preset:cyan', cssVar: 'var(--symbol-color-cyan)' },
  { value: 'preset:pink', cssVar: 'var(--symbol-color-pink)' },
  { value: 'preset:amber', cssVar: 'var(--symbol-color-amber)' },
  { value: 'preset:mint', cssVar: 'var(--symbol-color-mint)' },
  { value: 'preset:time', cssVar: 'var(--symbol-color-time)' },
  { value: 'preset:folder', cssVar: 'var(--symbol-color-folder)' },
] as const

const LEGACY_COLOR_MAP: Record<string, string> = {
  '#f8fafc': 'preset:surface',
  '#dbeafe': 'preset:sky',
  '#dcfce7': 'preset:green',
  '#fef3c7': 'preset:yellow',
  '#ede9fe': 'preset:violet',
  '#fee2e2': 'preset:rose',
  '#e0f2fe': 'preset:cyan',
  '#fce7f3': 'preset:pink',
  '#fde68a': 'preset:amber',
  '#d1fae5': 'preset:mint',
  '#f3e8ff': 'preset:time',
  '#ead6c9': 'preset:folder',
  '#f3f4f6': 'preset:template',
  '#e5f6e6': 'preset:fixed',
}

const PRESET_TO_CSS_VAR = new Map(PRESET_SYMBOL_COLORS.map((preset) => [preset.value, preset.cssVar]))

export function isHexColor(value: string | null | undefined) {
  return Boolean(value && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value))
}

export function normalizeSymbolColor(color: string | null | undefined) {
  if (!color) return DEFAULT_SYMBOL_COLOR
  const lower = color.toLowerCase()
  return LEGACY_COLOR_MAP[lower] ?? color
}

export function resolveSymbolColor(color: string | null | undefined) {
  const normalized = normalizeSymbolColor(color)
  return PRESET_TO_CSS_VAR.get(normalized) ?? normalized
}

function hexToRgb(value: string) {
  const hex = value.replace('#', '').trim()
  const normalized = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null

  const int = Number.parseInt(normalized, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function rgbStringToRgb(value: string) {
  const match = value.match(/rgba?\(([^)]+)\)/i)
  if (!match) return null

  const [r, g, b] = match[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()))

  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null

  return { r, g, b }
}

function toLinearChannel(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(rgb: { r: number; g: number; b: number }) {
  const r = toLinearChannel(rgb.r)
  const g = toLinearChannel(rgb.g)
  const b = toLinearChannel(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function readResolvedColor(color: string | null | undefined) {
  const resolved = resolveSymbolColor(color)
  if (resolved.startsWith('var(') && typeof window !== 'undefined') {
    const variableName = resolved.slice(4, -1).trim()
    const cssValue = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
    return cssValue || resolved
  }
  return resolved
}

export function getSymbolTextColor(color: string | null | undefined) {
  const resolved = readResolvedColor(color)
  const rgb = resolved.startsWith('#')
    ? hexToRgb(resolved)
    : rgbStringToRgb(resolved)

  if (!rgb) return 'var(--app-foreground)'

  return getRelativeLuminance(rgb) > 0.42 ? '#0f172a' : '#f8fafc'
}

export function getColorInputValue(color: string | null | undefined): string {
  return isHexColor(color) ? color : '#cbd5e1'
}

export function isPresetSymbolColor(color: string | null | undefined) {
  if (!color) return false
  return PRESET_TO_CSS_VAR.has(normalizeSymbolColor(color))
}
