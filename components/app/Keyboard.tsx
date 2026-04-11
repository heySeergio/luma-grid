'use client'

import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Delete, CornerDownLeft } from 'lucide-react'
import { SPANISH_DICTIONARY } from '@/lib/data/spanishDictionary'
import { keyboardThemeToCssVars, type KeyboardThemeColors } from '@/lib/keyboard/theme'
import {
  LETTER_ROWS,
  NUMBER_ROW,
  PUNCT_ROW,
  KB_SPECIAL_IDS,
  charKeyId,
} from '@/lib/keyboard/layout'

interface Props {
  onTextAdd: (text: string) => void | Promise<void>
  /** Colores personalizados (perfil); solo afecta apariencia. */
  theme?: KeyboardThemeColors | null
  /**
   * Modo editor: no escribe; al pulsar una tecla se llama `onKeyPick` con su id estable.
   * Sigue mostrando el mismo aspecto (incl. predicciones desactivadas).
   */
  pickMode?: boolean
  onKeyPick?: (keyId: string) => void
  /** Resalta la tecla seleccionada en modo editor. */
  selectedKeyId?: string | null
}

export default function Keyboard({
  onTextAdd,
  theme,
  pickMode = false,
  onKeyPick,
  selectedKeyId = null,
}: Props) {
  const [currentText, setCurrentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const words = currentText.split(' ')
  const lastWord = words[words.length - 1].toLowerCase()

  const predictions =
    pickMode || !lastWord
      ? []
      : SPANISH_DICTIONARY.filter(w => w.startsWith(lastWord) && w !== lastWord).slice(0, 8)

  const keyColors = theme?.keyColors
  const keyTextColors = theme?.keyTextColors

  const keyFill = (id: string) => {
    const hex = keyColors?.[id]
    if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) return { backgroundColor: hex } as const
    return undefined
  }

  /** Color de texto por tecla; en la barra de escritura usa `--kb-input-text` por el `!important` del tema. */
  const keyTextFill = (id: string): CSSProperties | undefined => {
    const hex = keyTextColors?.[id]
    if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return undefined
    if (id === KB_SPECIAL_IDS.composer) {
      return { ['--kb-input-text' as string]: hex }
    }
    return { color: hex }
  }

  const keyStyle = (id: string): CSSProperties | undefined => {
    const bg = keyFill(id)
    const tx = keyTextFill(id)
    if (!bg && !tx) return undefined
    return { ...bg, ...tx }
  }

  const keyRing = (id: string) =>
    pickMode && selectedKeyId === id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--app-bg)]' : ''

  const handleKey = (key: string) => {
    const char = key.length === 1 && /[A-ZÑ]/.test(key) ? key.toLowerCase() : key
    setCurrentText(prev => prev + char)
  }

  const handleDelete = () => {
    setCurrentText(prev => prev.slice(0, -1))
  }

  const handleAddWord = async () => {
    if (!currentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onTextAdd(currentText.trim())
      setCurrentText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cssVars = keyboardThemeToCssVars(theme ?? null)

  return (
    <div
      className="keyboard-theme-scope flex h-full min-h-0 flex-col gap-2 rounded-[1rem] p-2"
      style={cssVars}
    >
      {/* Input line */}
      <div className="grid shrink-0 grid-cols-12 gap-1.5">
        {pickMode ? (
          <button
            type="button"
            onClick={() => onKeyPick?.(KB_SPECIAL_IDS.composer)}
            style={keyStyle(KB_SPECIAL_IDS.composer)}
            className={`kb-composer-input app-panel col-span-10 flex min-h-[68px] items-center rounded-[1.4rem] border px-4 py-2 text-left text-2xl font-semibold transition cursor-pointer ${keyRing(KB_SPECIAL_IDS.composer)}`}
          >
            {currentText || <span className="text-slate-400 dark:text-slate-500">Escribe aquí...</span>}
          </button>
        ) : (
          <div
            style={keyStyle(KB_SPECIAL_IDS.composer)}
            className="kb-composer-input app-panel col-span-10 flex min-h-[68px] items-center rounded-[1.4rem] border px-4 py-2"
          >
            <input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Borrador de escritura antes de enviar a la frase"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleAddWord()
                }
              }}
              placeholder="Escribe aquí..."
              className="w-full min-w-0 border-0 bg-transparent p-0 text-2xl font-semibold text-[inherit] outline-none ring-0 placeholder:text-slate-400 focus:ring-0 dark:placeholder:text-slate-500"
            />
          </div>
        )}
        <button
          onClick={() => {
            if (pickMode) {
              onKeyPick?.(KB_SPECIAL_IDS.send)
              return
            }
            void handleAddWord()
          }}
          disabled={pickMode ? false : !currentText.trim() || isSubmitting}
          style={keyStyle(KB_SPECIAL_IDS.send)}
          className={`ui-icon-button ui-key-button col-span-1 grid place-items-center rounded-[1.3rem] disabled:opacity-40 ${keyRing(KB_SPECIAL_IDS.send)}`}
          aria-label="Agregar palabra"
          type="button"
        >
          <CornerDownLeft size={24} />
        </button>
        <button
          onClick={() => {
            if (pickMode) {
              onKeyPick?.(KB_SPECIAL_IDS.backspace)
              return
            }
            handleDelete()
          }}
          style={keyStyle(KB_SPECIAL_IDS.backspace)}
          className={`ui-icon-button ui-key-button col-span-1 grid place-items-center rounded-[1.3rem] ${keyRing(KB_SPECIAL_IDS.backspace)}`}
          aria-label="Borrar caracter"
          type="button"
        >
          <Delete size={24} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <div className="grid min-h-0 flex-1 grid-rows-5 gap-1.5">
          {/* Number row */}
          <div className="grid grid-cols-10 gap-1.5">
            {NUMBER_ROW.map(key => {
              const id = charKeyId(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (pickMode) {
                      onKeyPick?.(id)
                      return
                    }
                    handleKey(key)
                  }}
                  style={keyStyle(id)}
                  className={`ui-key-button h-full rounded-[1.25rem] text-5xl font-bold ${keyRing(id)}`}
                >
                  {key}
                </button>
              )
            })}
          </div>

          {/* Letter rows */}
          {LETTER_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-1.5">
              {row.map(key => {
                const id = charKeyId(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (pickMode) {
                        onKeyPick?.(id)
                        return
                      }
                      handleKey(key)
                    }}
                    style={keyStyle(id)}
                    className={`ui-key-button h-full rounded-[1.25rem] text-5xl font-bold ${keyRing(id)}`}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Punctuation + space row */}
          <div className="grid grid-cols-12 gap-1.5">
            {PUNCT_ROW.slice(0, 3).map(key => {
              const id = charKeyId(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (pickMode) {
                      onKeyPick?.(id)
                      return
                    }
                    handleKey(key)
                  }}
                  style={keyStyle(id)}
                  className={`ui-key-button h-full rounded-[1.25rem] text-5xl font-bold ${keyRing(id)}`}
                >
                  {key}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => {
                if (pickMode) {
                  onKeyPick?.(KB_SPECIAL_IDS.space)
                  return
                }
                setCurrentText(prev => prev + ' ')
              }}
              style={keyStyle(KB_SPECIAL_IDS.space)}
              className={`ui-key-button col-span-6 h-full rounded-[1.25rem] text-3xl font-semibold ${keyRing(KB_SPECIAL_IDS.space)}`}
            >
              Espacio
            </button>
            {PUNCT_ROW.slice(3).map(key => {
              const id = charKeyId(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (pickMode) {
                      onKeyPick?.(id)
                      return
                    }
                    handleKey(key)
                  }}
                  style={keyStyle(id)}
                  className={`ui-key-button h-full rounded-[1.25rem] text-5xl font-bold ${keyRing(id)}`}
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>

        {!pickMode && predictions.length > 0 ? (
          <div className="grid shrink-0 grid-cols-4 gap-1.5" style={{ gridAutoRows: 'minmax(48px, auto)' }}>
            {predictions.map((pred, idx) => (
              <button
                key={`pred-${idx}`}
                type="button"
                onClick={() => {
                  const newWords = [...words]
                  newWords[newWords.length - 1] = pred
                  setCurrentText(newWords.join(' ') + ' ')
                }}
                className="ui-soft-badge min-h-[48px] rounded-[1.25rem] px-2 py-1 text-center text-xl font-semibold shadow-sm transition hover:brightness-105"
              >
                {pred}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
