'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, House, Play, RotateCcw, Trash2, X } from 'lucide-react'
import { db } from '@/lib/dexie/db'
import { stopAllTtsPlayback } from '@/lib/voice/speakClient'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Phrase, Profile, Symbol, VoiceConfig } from '@/lib/supabase/types'
import { useClientReady } from '@/lib/ui/useClientReady'
import PictoEmoji from '@/components/ui/PictoEmoji'

type LocalProfile = Profile & {
  communication_gender?: 'male' | 'female'
}

type ConjugationTokenInput = {
  label: string
  lexemeId?: string | null
  posType?: string | null
  normalizedLabel?: string | null
}

interface Props {
  /** Orden canónico (sujeto → verbo → …) para mostrar y reproducir. */
  symbols: Symbol[]
  profile: LocalProfile | null
  voiceConfig: VoiceConfig | null
  canGoBackFolder: boolean
  onGoBackFolder: () => void
  onGoHome: () => void
  onDeleteLast: () => void
  onClearAll: () => void
  onPhraseSaved?: () => void
  /** Quitar una palabra concreta de la selección (id de la entrada en la frase). */
  onRemoveSymbol?: (phraseEntryId: string) => void
  /** Tras reproducir con éxito: persistir en servidor (frases frecuentes). */
  onAfterSpeak?: (payload: { text: string; symbolsUsed: { id: string; label: string }[] }) => void
  /** Si existe, sustituye Web Speech (p. ej. audio generado vía /api/tts). */
  speakPhrase?: (phrase: string) => Promise<void>
  /** Al cambiar (p. ej. frase rápida inyectada), limpia la línea de conjugación previa. */
  externalCompositionReset?: number
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
  onRemoveSymbol,
  onAfterSpeak,
  speakPhrase,
  externalCompositionReset = 0,
}: Props) {
  const router = useRouter()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conjugated, setConjugated] = useState('')
  const [, setHomeClickCount] = useState(0)
  const [showAdminAccessPrompt, setShowAdminAccessPrompt] = useState(false)
  const homeClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Hasta tras hidratar: botones desactivados para alinear con SSR si `symbols` difiere en el primer frame. */
  const phraseChromeReady = useClientReady()
  const phraseActionsDisabled = !phraseChromeReady || symbols.length === 0

  useEffect(() => {
    if (externalCompositionReset > 0) {
      setConjugated('')
    }
  }, [externalCompositionReset])

  useEffect(() => {
    return () => {
      if (homeClickTimeout.current) {
        clearTimeout(homeClickTimeout.current)
      }
    }
  }, [])

  const handleHomeClick = () => {
    onGoHome()
    setHomeClickCount(prev => {
      const next = prev + 1
      if (next >= 5) {
        setShowAdminAccessPrompt(true)
        return 0
      }
      return next
    })
    if (homeClickTimeout.current) clearTimeout(homeClickTimeout.current)
    homeClickTimeout.current = setTimeout(() => setHomeClickCount(0), 2000)
  }

  const closeAdminAccessPrompt = () => {
    setShowAdminAccessPrompt(false)
  }

  const goToAdmin = () => {
    closeAdminAccessPrompt()
    router.push('/admin')
    router.refresh()
  }

  const previewText = conjugated || symbols.map(s => s.label).join(' ')

  const handleDeleteLastClick = () => {
    setConjugated('')
    onDeleteLast()
  }

  const handleClearAllClick = () => {
    setConjugated('')
    onClearAll()
  }

  const conjugatePhrase = useCallback(async (tokens: ConjugationTokenInput[]): Promise<string> => {
    if (tokens.length === 0) return ''
    if (tokens.length === 1) return tokens[0]?.label ?? ''

    try {
      const response = await fetch('/api/conjugate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words: tokens.map(token => token.label),
          tokens,
          gender: profile?.communication_gender ?? 'male',
        }),
      })
      if (!response.ok) throw new Error('API error')
      const data = await response.json()
      return data.phrase || tokens.map(token => token.label).join(' ')
    } catch {
      return tokens.map(token => token.label).join(' ')
    }
  }, [profile?.communication_gender])

  const handleSpeak = useCallback(async () => {
    if (symbols.length === 0 || isSpeaking) return

    setIsSpeaking(true)
    try {
      const tokens = symbols.map((symbol) => ({
        label: symbol.label,
        lexemeId: symbol.lexemeId ?? null,
        posType: symbol.posType ?? null,
        normalizedLabel: symbol.normalizedLabel ?? symbol.label.toLowerCase(),
      }))
      const phrase = await conjugatePhrase(tokens)
      setConjugated(phrase)

      if (speakPhrase) {
        await speakPhrase(phrase)
      } else {
        stopAllTtsPlayback()
        const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
        await adapter.speak(phrase, profile?.id || '')
      }

      const symbolsUsedForServer = symbols.map((s) => {
        const src = (s as Symbol & { sourceSymbolId?: string }).sourceSymbolId
        return { id: src ?? s.id, label: s.label }
      })
      onAfterSpeak?.({ text: phrase, symbolsUsed: symbolsUsedForServer })

      // Save to local history
      if (profile) {
        const localPhrase: Phrase = {
          id: `local-${Date.now()}`,
          profileId: profile.id,
          text: phrase,
          symbolsUsed: symbolsUsedForServer,
          isPinned: false,
          useCount: 1,
          createdAt: new Date().toISOString(),
        }
        await db.phrases.put(localPhrase)
        onPhraseSaved?.()
      }
    } catch (err) {
      console.error('Speech error:', err)
    } finally {
      setIsSpeaking(false)
    }
  }, [symbols, profile, isSpeaking, onPhraseSaved, onAfterSpeak, conjugatePhrase, speakPhrase])

  return (
    <>
      <div className="phrase-bar shrink-0 px-3 py-3 md:px-4">
        <div className="ui-toolbar-shell flex items-center gap-3 rounded-[2rem] px-3 py-3 md:gap-4 md:px-4">
        <button
          onClick={onGoBackFolder}
          disabled={!canGoBackFolder}
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Volver carpeta"
        >
          <ArrowLeft className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <button
          onClick={handleHomeClick}
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Ir al grid principal"
          type="button"
        >
          <House className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <div className="min-h-[92px] min-w-0 flex-1 rounded-[1.75rem] border border-slate-200/90 bg-[var(--phrase-inner)] px-4 py-3 shadow-[inset_0_1px_0_rgba(15,23,42,0.06)] dark:border-slate-500/55 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {symbols.length > 0 ? (
            <div className="flex items-center gap-2 overflow-hidden flex-wrap">
              {symbols.map((symbol, i) => (
                <div
                  key={`preview-${symbol.id}-${i}`}
                  className="ui-chip group relative inline-flex min-w-[72px] flex-col items-center justify-center rounded-2xl border-slate-200/80 bg-slate-100/95 px-3 py-2 shadow-sm dark:border-[color-mix(in_srgb,var(--app-border)_90%,transparent)] dark:bg-[color-mix(in_srgb,var(--app-surface-elevated)_78%,var(--app-border))] dark:shadow-none"
                >
                  {onRemoveSymbol ? (
                    <button
                      type="button"
                      onClick={() => onRemoveSymbol(symbol.id)}
                      className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-900/80 text-white opacity-0 shadow transition hover:bg-rose-600 group-hover:opacity-100"
                      aria-label={`Quitar ${symbol.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                  {symbol.imageUrl ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
                      <Image
                        src={symbol.imageUrl}
                        alt={symbol.label}
                        width={40}
                        height={40}
                        className="max-h-full max-w-full object-contain"
                        unoptimized
                      />
                    </span>
                  ) : (
                    <PictoEmoji
                      emoji={symbol.emoji || '📝'}
                      className="text-2xl leading-none text-slate-900 dark:text-white sm:text-3xl"
                      aria-hidden
                    />
                  )}
                  <span className="mt-1 text-center text-[11px] font-semibold leading-tight text-slate-900 dark:text-white sm:text-xs">
                    {symbol.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[var(--app-muted-foreground)] sm:text-base">
              Toca los símbolos para construir una frase...
            </p>
          )}
          {conjugated && (
            <p className="mt-2 truncate text-[11px] text-indigo-800 dark:text-indigo-100/90 sm:text-xs">
              Frase: {previewText}
            </p>
          )}
        </div>

        <button
          onClick={handleSpeak}
          disabled={phraseActionsDisabled || isSpeaking}
          type="button"
          className={`ui-primary-button h-14 w-14 shrink-0 rounded-[1.6rem] grid place-items-center transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 ${isSpeaking ? 'cursor-wait saturate-75' : ''}`}
          aria-label="Reproducir frase"
        >
          <Play className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <button
          onClick={handleDeleteLastClick}
          disabled={phraseActionsDisabled}
          type="button"
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Eliminar ultima palabra"
        >
          <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>

        <button
          onClick={handleClearAllClick}
          disabled={phraseActionsDisabled}
          type="button"
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Borrar todo"
        >
          <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>
        </div>
      </div>

      {showAdminAccessPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl" style={{ background: 'var(--app-modal-backdrop)' }}>
          <div className="ui-modal-panel w-full max-w-sm rounded-[2rem] p-6 text-[var(--app-foreground)]">
            <h2 className="text-xl font-bold text-[var(--app-foreground)]">Panel de administración</h2>
            <p className="mt-2 text-sm text-[var(--app-muted-foreground)]">
              Abre el editor de símbolos y ajustes. Solo usuarios con sesión iniciada pueden entrar.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeAdminAccessPrompt}
                className="ui-secondary-button flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={goToAdmin}
                className="ui-primary-button flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
