'use client'

import { useState } from 'react'
import { Delete, CornerDownLeft } from 'lucide-react'
import { SPANISH_DICTIONARY } from '@/lib/data/spanishDictionary'

interface Props {
  onTextAdd: (text: string) => void | Promise<void>
}

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const LETTER_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['@', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
]
const PUNCT_ROW = ['-', '?', '¿', '¡', '!', '#']

export default function Keyboard({ onTextAdd }: Props) {
  const [currentText, setCurrentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Split text into words to suggest for the last word being typed
  const words = currentText.split(' ')
  const lastWord = words[words.length - 1].toLowerCase()

  const predictions = lastWord
    ? SPANISH_DICTIONARY.filter(w => w.startsWith(lastWord) && w !== lastWord).slice(0, 8)
    : []

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

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 bg-transparent p-2">
      {/* Input line */}
      <div className="grid shrink-0 grid-cols-12 gap-1.5">
        <div className="app-panel col-span-10 flex min-h-[68px] items-center rounded-[1.4rem] px-4 py-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {currentText || <span className="text-slate-400 dark:text-slate-500">Escribe aquí...</span>}
        </div>
        <button
          onClick={handleAddWord}
          disabled={!currentText.trim() || isSubmitting}
          className="ui-icon-button col-span-1 grid place-items-center rounded-[1.3rem] disabled:opacity-40"
          aria-label="Agregar palabra"
        >
          <CornerDownLeft size={24} />
        </button>
        <button
          onClick={handleDelete}
          className="ui-icon-button col-span-1 grid place-items-center rounded-[1.3rem]"
          aria-label="Borrar caracter"
        >
          <Delete size={24} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <div className="grid min-h-0 flex-1 grid-rows-5 gap-1.5">
          {/* Number row */}
          <div className="grid grid-cols-10 gap-1.5">
            {NUMBER_ROW.map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="ui-key-button h-full rounded-[1.25rem] text-5xl font-bold"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Letter rows */}
          {LETTER_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-10 gap-1.5">
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className="ui-key-button h-full rounded-[1.25rem] text-5xl font-bold"
                >
                  {key}
                </button>
              ))}
            </div>
          ))}

          {/* Punctuation + space row */}
          <div className="grid grid-cols-12 gap-1.5">
            {PUNCT_ROW.slice(0, 3).map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="ui-key-button h-full rounded-[1.25rem] text-5xl font-bold"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => setCurrentText(prev => prev + ' ')}
              className="ui-key-button col-span-6 h-full rounded-[1.25rem] text-3xl font-semibold text-slate-700 dark:text-slate-200"
            >
              Espacio
            </button>
            {PUNCT_ROW.slice(3).map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="ui-key-button h-full rounded-[1.25rem] text-5xl font-bold"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {predictions.length > 0 ? (
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
