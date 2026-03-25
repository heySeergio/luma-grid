'use client'

import { useState } from 'react'
import { Delete, CornerDownLeft } from 'lucide-react'

interface Props {
  onTextAdd: (text: string) => void
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

  const handleKey = (key: string) => {
    const char = key.length === 1 && /[A-ZÑ]/.test(key) ? key.toLowerCase() : key
    setCurrentText(prev => prev + char)
  }

  const handleDelete = () => {
    setCurrentText(prev => prev.slice(0, -1))
  }

  const handleAddWord = () => {
    if (currentText.trim()) {
      onTextAdd(currentText.trim())
      setCurrentText('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f1f3f7] p-1.5 gap-1.5">
      {/* Input line */}
      <div className="grid grid-cols-12 gap-1.5">
        <div className="col-span-10 rounded-md border border-slate-300 bg-white px-4 py-2 text-2xl font-semibold text-slate-800 min-h-[60px] flex items-center">
          {currentText || <span className="text-slate-400">Escribe aquí...</span>}
        </div>
        <button
          onClick={handleAddWord}
          disabled={!currentText.trim()}
          className="col-span-1 rounded-md border border-slate-300 bg-white text-slate-700 grid place-items-center disabled:opacity-40"
          aria-label="Agregar palabra"
        >
          <CornerDownLeft size={24} />
        </button>
        <button
          onClick={handleDelete}
          className="col-span-1 rounded-md border border-slate-300 bg-white text-slate-700 grid place-items-center"
          aria-label="Borrar caracter"
        >
          <Delete size={24} />
        </button>
      </div>

      <div className="flex-1 min-h-0 grid gap-1.5" style={{ gridTemplateRows: '7fr 3fr' }}>
        {/* 70% teclado */}
        <div className="min-h-0 grid gap-1.5 grid-rows-5">
          {/* Number row */}
          <div className="grid grid-cols-10 gap-1.5">
            {NUMBER_ROW.map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-full rounded-md border border-slate-300 bg-white text-5xl font-bold text-slate-900"
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
                  className="h-full rounded-md border border-slate-300 bg-white text-5xl font-bold text-slate-900"
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
                className="h-full rounded-md border border-slate-300 bg-white text-5xl font-bold text-slate-900"
              >
                {key}
              </button>
            ))}
            <button
              onClick={() => setCurrentText(prev => prev + ' ')}
              className="col-span-6 h-full rounded-md border border-slate-300 bg-white text-3xl font-semibold text-slate-700"
            >
              Espacio
            </button>
            {PUNCT_ROW.slice(3).map(key => (
              <button
                key={key}
                onClick={() => handleKey(key)}
                className="h-full rounded-md border border-slate-300 bg-white text-5xl font-bold text-slate-900"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* 30% panel inferior */}
        <div className="min-h-0 grid grid-cols-4 gap-1.5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-full min-h-[56px] rounded-md border border-[#dcc8a1] bg-[#ecd9b1]/90"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
