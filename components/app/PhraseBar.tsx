'use client'

import { useState, useCallback } from 'react'
import { ArrowLeft, House, Play, RotateCcw, Trash2 } from 'lucide-react'
import { db } from '@/lib/dexie/db'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Profile, Symbol, VoiceConfig } from '@/lib/supabase/types'

interface Props {
  symbols: Symbol[]
  profile: Profile | null
  voiceConfig: VoiceConfig | null
  canGoBackFolder: boolean
  onGoBackFolder: () => void
  onGoHome: () => void
  onDeleteLast: () => void
  onClearAll: () => void
  onPhraseSaved?: () => void
}

export default function PhraseBar({
  symbols,
  profile,
  canGoBackFolder,
  onGoBackFolder,
  onGoHome,
  onDeleteLast,
  onClearAll,
  onPhraseSaved,
}: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conjugated, setConjugated] = useState('')
  const previewText = conjugated || symbols.map(s => s.label).join(' ')

  const handleDeleteLastClick = () => {
    setConjugated('')
    onDeleteLast()
  }

  const handleClearAllClick = () => {
    setConjugated('')
    onClearAll()
  }

  const conjugatePhrase = async (words: string[]): Promise<string> => {
    if (words.length === 0) return ''
    if (words.length === 1) return words[0]

    try {
      const response = await fetch('/api/conjugate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, gender: profile?.communication_gender ?? 'male' }),
      })
      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      return data.phrase || words.join(' ')
    } catch {
      return words.join(' ')
    }
  }

  const handleSpeak = useCallback(async () => {
    if (symbols.length === 0 || isSpeaking) return

    setIsSpeaking(true)
    try {
      const words = symbols.map(s => s.label)
      const phrase = await conjugatePhrase(words)
      setConjugated(phrase)

      // Speak with Web Speech API
      const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
      await adapter.speak(phrase, profile?.id || '')

      // Save to local history
      if (profile) {
        const localPhrase = {
          id: `local-${Date.now()}`,
          profile_id: profile.id,
          text: phrase,
          symbols_used: symbols.map(s => ({ id: s.id, label: s.label })),
          is_pinned: false,
          use_count: 1,
          created_at: new Date().toISOString(),
        }
        await db.phrases.put(localPhrase as any)
        onPhraseSaved?.()
      }
    } catch (err) {
      console.error('Speech error:', err)
    } finally {
      setIsSpeaking(false)
    }
  }, [symbols, profile, isSpeaking])

  return (
    <div className="phrase-bar bg-[#3f4e77] px-3 py-3 shrink-0 border-b border-white/20">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onGoBackFolder}
          disabled={!canGoBackFolder}
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 shrink-0 rounded-md bg-white text-slate-900 border border-slate-300 grid place-items-center hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label="Volver carpeta"
        >
          <ArrowLeft className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <button
          onClick={onGoHome}
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 shrink-0 rounded-md bg-white text-slate-900 border border-slate-300 grid place-items-center hover:bg-slate-100 transition-colors"
          aria-label="Ir al grid principal"
        >
          <House className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <div className="min-w-0 flex-1 rounded-lg bg-[#2e3a5b] px-4 py-3 border border-white/20 min-h-[92px]">
          {symbols.length > 0 ? (
            <div className="flex items-center gap-2 overflow-hidden flex-wrap">
              {symbols.map((symbol, i) => (
                <div
                  key={`preview-${symbol.id}-${i}`}
                  className="inline-flex flex-col items-center justify-center rounded-md bg-white/10 px-2 py-1.5 min-w-[68px]"
                >
                  <span className="text-2xl sm:text-3xl leading-none">{symbol.emoji || '📝'}</span>
                  <span className="mt-1 text-[11px] sm:text-xs font-semibold text-white text-center leading-tight">
                    {symbol.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base font-semibold text-slate-200">
              Toca los simbolos para construir una frase...
            </p>
          )}
          {conjugated && (
            <p className="mt-1 truncate text-[11px] sm:text-xs text-indigo-100">
              Frase: {previewText}
            </p>
          )}
        </div>

        <button
          onClick={handleSpeak}
          disabled={symbols.length === 0 || isSpeaking}
          className={`h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 shrink-0 rounded-md grid place-items-center transition-all ${
            isSpeaking ? 'bg-indigo-400 cursor-wait' : 'bg-rose-400 hover:bg-rose-300'
          } text-white disabled:opacity-40`}
          aria-label="Reproducir frase"
        >
          <Play className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <button
          onClick={handleDeleteLastClick}
          disabled={symbols.length === 0}
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 shrink-0 rounded-md bg-white text-slate-900 border border-slate-300 grid place-items-center hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label="Eliminar ultima palabra"
        >
          <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>

        <button
          onClick={handleClearAllClick}
          disabled={symbols.length === 0}
          className="h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 shrink-0 rounded-md bg-white text-slate-900 border border-slate-300 grid place-items-center hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label="Borrar todo"
        >
          <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>
      </div>

    </div>
  )
}
