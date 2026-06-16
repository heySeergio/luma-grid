'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw } from 'lucide-react'
import Keyboard from '@/components/app/Keyboard'
import { KEYBOARD_THEME_KEYS, type KeyboardGlobalThemeKey, type KeyboardThemeColors } from '@/lib/keyboard/theme'
import { keyboardKeyIdLabel, isAllowedKeyColorId } from '@/lib/keyboard/layout'

/** Colores habituales para el texto sobre fondos claros u oscuros. */
const KEY_TEXT_PRESETS = [
  '#0f172a',
  '#1e293b',
  '#334155',
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0891b2',
] as const

/** Paleta rápida para teclas: tonos equilibrados para fondos de tecla (contraste con texto habitual). */
const KEY_COLOR_PRESETS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#64748b',
  '#334155',
  '#1e293b',
  '#fef9c3',
  '#fce7f3',
  '#dcfce7',
  '#e0f2fe',
  '#f1f5f9',
] as const

type Props = {
  initialTheme: KeyboardThemeColors | null
  profileName: string
  onSave: (theme: KeyboardThemeColors) => Promise<{ ok: boolean; error?: string }>
  onCancel?: () => void
  showCancel?: boolean
}

function emptyGlobals(): Record<KeyboardGlobalThemeKey, string> {
  const d = {} as Record<KeyboardGlobalThemeKey, string>
  for (const k of KEYBOARD_THEME_KEYS) {
    d[k] = ''
  }
  return d
}

function loadThemeDraft(initialTheme: KeyboardThemeColors | null) {
  const globalsDraft = emptyGlobals()
  const src = initialTheme ?? {}
  for (const k of KEYBOARD_THEME_KEYS) {
    const v = src[k]
    globalsDraft[k] = typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : ''
  }
  const kc = src.keyColors
  const keyColors =
    kc && typeof kc === 'object'
      ? Object.fromEntries(
          Object.entries(kc).filter(
            ([id, v]) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) && isAllowedKeyColorId(id),
          ),
        )
      : {}
  const ktc = src.keyTextColors
  const keyTextColors =
    ktc && typeof ktc === 'object'
      ? Object.fromEntries(
          Object.entries(ktc).filter(
            ([id, v]) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) && isAllowedKeyColorId(id),
          ),
        )
      : {}
  return { globalsDraft, keyColors, keyTextColors }
}

export default function KeyboardThemeEditor({
  initialTheme,
  profileName,
  onSave,
  onCancel,
  showCancel = false,
}: Props) {
  const [globalsDraft, setGlobalsDraft] = useState(() => emptyGlobals())
  const [keyColors, setKeyColors] = useState<Record<string, string>>({})
  const [keyTextColors, setKeyTextColors] = useState<Record<string, string>>({})
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const draft = loadThemeDraft(initialTheme)
    setGlobalsDraft(draft.globalsDraft)
    setKeyColors(draft.keyColors)
    setKeyTextColors(draft.keyTextColors)
    setSelectedKeyId(null)
    setError(null)
  }, [initialTheme])

  const mergedPreviewTheme: KeyboardThemeColors = {
    ...KEYBOARD_THEME_KEYS.reduce((acc, k) => {
      const v = globalsDraft[k]?.trim()
      if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) (acc as KeyboardThemeColors)[k] = v
      return acc
    }, {} as KeyboardThemeColors),
    keyColors: Object.keys(keyColors).length > 0 ? { ...keyColors } : undefined,
    keyTextColors: Object.keys(keyTextColors).length > 0 ? { ...keyTextColors } : undefined,
  }

  const selectedHex =
    selectedKeyId && keyColors[selectedKeyId] && /^#[0-9A-Fa-f]{6}$/.test(keyColors[selectedKeyId])
      ? keyColors[selectedKeyId]
      : '#6366f1'

  const selectedTextHex =
    selectedKeyId && keyTextColors[selectedKeyId] && /^#[0-9A-Fa-f]{6}$/.test(keyTextColors[selectedKeyId])
      ? keyTextColors[selectedKeyId]
      : '#0f172a'

  const setSelectedKeyColor = useCallback(
    (hex: string) => {
      if (!selectedKeyId) return
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return
      setKeyColors((prev) => ({ ...prev, [selectedKeyId]: hex }))
    },
    [selectedKeyId],
  )

  const clearSelectedKeyColor = useCallback(() => {
    if (!selectedKeyId) return
    setKeyColors((prev) => {
      const n = { ...prev }
      delete n[selectedKeyId]
      return n
    })
  }, [selectedKeyId])

  const setSelectedKeyTextColor = useCallback(
    (hex: string) => {
      if (!selectedKeyId) return
      if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return
      setKeyTextColors((prev) => ({ ...prev, [selectedKeyId]: hex }))
    },
    [selectedKeyId],
  )

  const clearSelectedKeyTextColor = useCallback(() => {
    if (!selectedKeyId) return
    setKeyTextColors((prev) => {
      const n = { ...prev }
      delete n[selectedKeyId]
      return n
    })
  }, [selectedKeyId])

  const buildThemePayload = (): KeyboardThemeColors => {
    const out: KeyboardThemeColors = {}
    for (const k of KEYBOARD_THEME_KEYS) {
      const v = globalsDraft[k]?.trim()
      if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) out[k] = v
    }
    if (Object.keys(keyColors).length > 0) out.keyColors = { ...keyColors }
    if (Object.keys(keyTextColors).length > 0) out.keyTextColors = { ...keyTextColors }
    return out
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await onSave(buildThemePayload())
      if (!res.ok) {
        setError(res.error ?? 'No se pudo guardar.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async () => {
    setSaving(true)
    setError(null)
    setGlobalsDraft(emptyGlobals())
    setKeyColors({})
    setKeyTextColors({})
    setSelectedKeyId(null)
    try {
      const res = await onSave({})
      if (!res.ok) {
        setError(res.error ?? 'No se pudo restaurar la plantilla.')
      }
    } finally {
      setSaving(false)
    }
  }

  const noopAdd = async () => {}

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 border-b border-slate-200/70 pb-3 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-slate-100">
          Colores del teclado
        </h2>
        <p className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400 sm:text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{profileName}</span>
          {' · '}
          Vista previa a la izquierda; fondo y texto por tecla en el panel derecho.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-slate-200/80 dark:border-slate-700/80 lg:flex-row">
        <div className="flex min-h-[clamp(22rem,52dvh,40rem)] flex-1 items-start justify-center overflow-x-hidden overflow-y-auto border-b border-slate-100/80 bg-slate-50/50 px-3 py-4 dark:border-slate-800 dark:bg-slate-950/20 lg:min-h-[clamp(24rem,50dvh,38rem)] lg:border-b-0 lg:border-r lg:py-5">
          <div className="w-full max-w-[640px] shrink-0 origin-top scale-[0.88] pb-2 sm:scale-95 lg:max-w-none lg:scale-100 xl:px-2">
            <Keyboard
              theme={mergedPreviewTheme}
              pickMode
              selectedKeyId={selectedKeyId}
              onKeyPick={(id) => setSelectedKeyId(id)}
              onTextAdd={noopAdd}
            />
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col overflow-y-auto border-slate-100/80 bg-gradient-to-b from-indigo-500/[0.04] to-[var(--app-surface-muted)] dark:border-slate-800 dark:from-indigo-500/10 lg:w-[min(100%,20rem)] lg:border-b-0 lg:border-l xl:w-[22rem]">
          {selectedKeyId ? (
            <div className="space-y-3 p-4 sm:p-5">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                  Tecla
                </p>
                <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  {keyboardKeyIdLabel(selectedKeyId)}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">Fondo — sugeridos</p>
                <div
                  className="grid grid-cols-7 gap-1.5"
                  role="group"
                  aria-label="Colores sugeridos para el fondo de la tecla"
                >
                  {KEY_COLOR_PRESETS.map((hex) => {
                    const current = keyColors[selectedKeyId]
                    const active =
                      typeof current === 'string' &&
                      /^#[0-9A-Fa-f]{6}$/.test(current) &&
                      current.toLowerCase() === hex.toLowerCase()
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setSelectedKeyColor(hex)}
                        title={hex}
                        aria-pressed={active}
                        className={`relative aspect-square min-h-7 w-full max-h-9 rounded-lg border-2 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-surface-muted)] dark:focus-visible:ring-offset-slate-900 ${
                          active
                            ? 'border-indigo-500 ring-1 ring-indigo-400/50 dark:border-indigo-400'
                            : 'border-black/[0.08] hover:scale-105 hover:border-slate-300 dark:border-white/15 dark:hover:border-white/30'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {active ? (
                          <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" aria-hidden />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Fondo — personalizado</p>
                <div className="mt-2 flex items-end gap-2">
                  <input
                    type="color"
                    value={selectedHex}
                    onChange={(e) => setSelectedKeyColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-600"
                    aria-label="Selector de color de fondo personalizado"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="kb-key-hex" className="sr-only">
                      Código HEX del fondo
                    </label>
                    <input
                      id="kb-key-hex"
                      type="text"
                      value={keyColors[selectedKeyId] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        if (v === '') {
                          clearSelectedKeyColor()
                          return
                        }
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) setSelectedKeyColor(v)
                      }}
                      placeholder="#rrggbb"
                      spellCheck={false}
                      autoComplete="off"
                      className="app-input w-full rounded-lg px-2 py-2 font-mono text-sm tracking-wide"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelectedKeyColor}
                className="w-full rounded-lg border border-slate-200/90 bg-white/90 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Quitar color de fondo de esta tecla
              </button>

              <div className="border-t border-slate-200/80 pt-3 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">Texto — sugeridos</p>
                <div
                  className="grid grid-cols-7 gap-1.5"
                  role="group"
                  aria-label="Colores sugeridos para el texto de la tecla"
                >
                  {KEY_TEXT_PRESETS.map((hex) => {
                    const current = keyTextColors[selectedKeyId]
                    const active =
                      typeof current === 'string' &&
                      /^#[0-9A-Fa-f]{6}$/.test(current) &&
                      current.toLowerCase() === hex.toLowerCase()
                    const isLight = hex === '#ffffff' || hex === '#f8fafc' || hex === '#e2e8f0'
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setSelectedKeyTextColor(hex)}
                        title={hex}
                        aria-pressed={active}
                        className={`relative aspect-square min-h-7 w-full max-h-9 rounded-lg border-2 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-surface-muted)] dark:focus-visible:ring-offset-slate-900 ${
                          active
                            ? 'border-indigo-500 ring-1 ring-indigo-400/50 dark:border-indigo-400'
                            : 'border-black/[0.08] hover:scale-105 hover:border-slate-300 dark:border-white/15 dark:hover:border-white/30'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-[0.65rem] font-bold ${
                            isLight ? 'text-slate-800' : 'text-white'
                          }`}
                          aria-hidden
                        >
                          A
                        </span>
                        {active ? (
                          <span className="absolute inset-0 flex items-start justify-end p-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-sm ring-1 ring-white" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/90 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Texto — personalizado</p>
                <div className="mt-2 flex items-end gap-2">
                  <input
                    type="color"
                    value={selectedTextHex}
                    onChange={(e) => setSelectedKeyTextColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-600"
                    aria-label="Selector de color de texto personalizado"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="kb-key-text-hex" className="sr-only">
                      Código HEX del texto
                    </label>
                    <input
                      id="kb-key-text-hex"
                      type="text"
                      value={keyTextColors[selectedKeyId] ?? ''}
                      onChange={(e) => {
                        const v = e.target.value.trim()
                        if (v === '') {
                          clearSelectedKeyTextColor()
                          return
                        }
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) setSelectedKeyTextColor(v)
                      }}
                      placeholder="#rrggbb"
                      spellCheck={false}
                      autoComplete="off"
                      className="app-input w-full rounded-lg px-2 py-2 font-mono text-sm tracking-wide"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelectedKeyTextColor}
                className="w-full rounded-lg border border-slate-200/90 bg-white/90 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Quitar color de texto de esta tecla
              </button>
            </div>
          ) : (
            <div className="flex flex-1 items-center p-4 sm:p-5">
              <p className="text-center text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                Pulsa una tecla del teclado para ajustar su fondo y el color del texto.
              </p>
            </div>
          )}
        </aside>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleRestore()}
          className="ui-secondary-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          <RotateCcw size={16} aria-hidden />
          Restaurar plantilla
        </button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          {showCancel && onCancel ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => !saving && onCancel()}
              className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="ui-primary-button rounded-2xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar colores'}
          </button>
        </div>
      </div>
    </div>
  )
}
