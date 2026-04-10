'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import Keyboard from '@/components/app/Keyboard'
import {
  KEYBOARD_THEME_KEYS,
  KEYBOARD_THEME_LABELS,
  type KeyboardGlobalThemeKey,
  type KeyboardThemeColors,
} from '@/lib/keyboard/theme'
import { keyboardKeyIdLabel, isAllowedKeyColorId } from '@/lib/keyboard/layout'

type Props = {
  open: boolean
  initialTheme: KeyboardThemeColors | null
  profileName: string
  onClose: () => void
  onSave: (theme: KeyboardThemeColors) => Promise<{ ok: boolean; error?: string }>
}

function emptyGlobals(): Record<KeyboardGlobalThemeKey, string> {
  const d = {} as Record<KeyboardGlobalThemeKey, string>
  for (const k of KEYBOARD_THEME_KEYS) {
    d[k] = ''
  }
  return d
}

export default function KeyboardThemeModal({
  open,
  initialTheme,
  profileName,
  onClose,
  onSave,
}: Props) {
  const [globalsDraft, setGlobalsDraft] = useState(() => emptyGlobals())
  const [keyColors, setKeyColors] = useState<Record<string, string>>({})
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const next = emptyGlobals()
    const src = initialTheme ?? {}
    for (const k of KEYBOARD_THEME_KEYS) {
      const v = src[k]
      next[k] = typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) ? v : ''
    }
    setGlobalsDraft(next)
    const kc = src.keyColors
    setKeyColors(
      kc && typeof kc === 'object'
        ? Object.fromEntries(
            Object.entries(kc).filter(
              ([id, v]) => typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v) && isAllowedKeyColorId(id),
            ),
          )
        : {},
    )
    setSelectedKeyId(null)
    setAdvancedOpen(false)
    setError(null)
  }, [open, initialTheme])

  const mergedPreviewTheme: KeyboardThemeColors = {
    ...KEYBOARD_THEME_KEYS.reduce((acc, k) => {
      const v = globalsDraft[k]?.trim()
      if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) (acc as KeyboardThemeColors)[k] = v
      return acc
    }, {} as KeyboardThemeColors),
    keyColors: Object.keys(keyColors).length > 0 ? { ...keyColors } : undefined,
  }

  const selectedHex =
    selectedKeyId && keyColors[selectedKeyId] && /^#[0-9A-Fa-f]{6}$/.test(keyColors[selectedKeyId])
      ? keyColors[selectedKeyId]
      : '#6366f1'

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

  const buildThemePayload = (): KeyboardThemeColors => {
    const out: KeyboardThemeColors = {}
    for (const k of KEYBOARD_THEME_KEYS) {
      const v = globalsDraft[k]?.trim()
      if (v && /^#[0-9A-Fa-f]{6}$/.test(v)) out[k] = v
    }
    if (Object.keys(keyColors).length > 0) out.keyColors = { ...keyColors }
    return out
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await onSave(buildThemePayload())
      if (!res.ok) {
        setError(res.error ?? 'No se pudo guardar.')
        return
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const noopAdd = async () => {}

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--app-modal-backdrop)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
          />
          <motion.div
            role="dialog"
            aria-labelledby="keyboard-theme-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="ui-modal-panel relative z-[1] flex max-h-[min(92dvh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] sm:rounded-[2rem]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100/80 p-4 dark:border-slate-800 sm:p-5">
              <div>
                <h2 id="keyboard-theme-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Colores del teclado
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tablero: <span className="font-medium text-slate-700 dark:text-slate-300">{profileName}</span>
                  {' · '}
                  Pulsa cada tecla en la vista previa y elige su color. Solo se modifica el color de fondo de esa tecla.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && onClose()}
                className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {selectedKeyId ? (
              <div className="flex shrink-0 flex-col gap-2 border-b border-slate-100/80 bg-[var(--app-surface-muted)] px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Tecla:{' '}
                  <span className="font-mono text-indigo-600 dark:text-indigo-300">
                    {keyboardKeyIdLabel(selectedKeyId)}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={selectedHex}
                    onChange={(e) => setSelectedKeyColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-600"
                    aria-label="Color de la tecla"
                  />
                  <input
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
                    className="app-input w-[7.5rem] rounded-xl px-2 py-1.5 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={clearSelectedKeyColor}
                    className="shrink-0 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Quitar color
                  </button>
                </div>
              </div>
            ) : (
              <p className="shrink-0 border-b border-slate-100/80 bg-indigo-500/5 px-4 py-2.5 text-center text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-indigo-500/10 dark:text-slate-300 sm:px-5">
                Toca una tecla en la vista previa para asignarle un color.
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
              <div className="mx-auto max-w-[min(100%,520px)] origin-top scale-[0.72] sm:scale-[0.82] md:max-w-none md:scale-100">
                <Keyboard
                  theme={mergedPreviewTheme}
                  pickMode
                  selectedKeyId={selectedKeyId}
                  onKeyPick={(id) => setSelectedKeyId(id)}
                  onTextAdd={noopAdd}
                />
              </div>
            </div>

            <div className="border-t border-slate-100/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50 sm:px-5"
              >
                Colores generales (fondo del área, barra, sugerencias…)
                <ChevronDown
                  size={18}
                  className={`shrink-0 transition ${advancedOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {advancedOpen ? (
                <div className="space-y-3 border-t border-slate-100/80 px-4 pb-4 dark:border-slate-800 sm:px-5">
                  <ul className="space-y-3 pt-3">
                    {KEYBOARD_THEME_KEYS.map((key) => (
                      <li key={key} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                        <label
                          htmlFor={`kb-adv-${key}`}
                          className="min-w-0 flex-1 text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                          {KEYBOARD_THEME_LABELS[key]}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id={`kb-adv-${key}`}
                            type="color"
                            value={
                              globalsDraft[key] && /^#[0-9A-Fa-f]{6}$/.test(globalsDraft[key])
                                ? globalsDraft[key]
                                : '#6366f1'
                            }
                            onChange={(e) =>
                              setGlobalsDraft((d) => ({ ...d, [key]: e.target.value }))
                            }
                            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-600"
                          />
                          <input
                            type="text"
                            value={globalsDraft[key]}
                            onChange={(e) => setGlobalsDraft((d) => ({ ...d, [key]: e.target.value }))}
                            placeholder="#hex"
                            spellCheck={false}
                            className="app-input w-[7.5rem] rounded-xl px-2 py-1.5 font-mono text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setGlobalsDraft((d) => ({ ...d, [key]: '' }))}
                            className="shrink-0 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="border-t border-slate-100/80 px-4 py-2 text-sm font-medium text-rose-600 dark:border-slate-800 dark:text-rose-400 sm:px-5" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => !saving && onClose()}
                className="ui-secondary-button rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="ui-primary-button rounded-2xl px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar colores'}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
