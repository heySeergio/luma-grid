'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { ArrowLeft, House, Play, RotateCcw, Trash2 } from 'lucide-react'
import { db } from '@/lib/dexie/db'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Phrase, Profile, Symbol, VoiceConfig } from '@/lib/supabase/types'

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
  symbols: Symbol[]
  profile: LocalProfile | null
  voiceConfig: VoiceConfig | null
  canGoBackFolder: boolean
  onGoBackFolder: () => void
  onGoHome: () => void
  onDeleteLast: () => void
  onClearAll: () => void
  onPhraseSaved?: () => void
  /** Si existe, sustituye Web Speech (p. ej. ElevenLabs vía /api/tts). */
  speakPhrase?: (phrase: string) => Promise<void>
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
  speakPhrase,
}: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conjugated, setConjugated] = useState('')
  const [, setHomeClickCount] = useState(0)
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordError, setAdminPasswordError] = useState('')
  const [isValidatingAdminPassword, setIsValidatingAdminPassword] = useState(false)
  const homeClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        setShowAdminPasswordPrompt(true)
        setAdminPassword('')
        setAdminPasswordError('')
        return 0
      }
      return next
    })
    if (homeClickTimeout.current) clearTimeout(homeClickTimeout.current)
    homeClickTimeout.current = setTimeout(() => setHomeClickCount(0), 2000)
  }

  const closeAdminPasswordPrompt = () => {
    setShowAdminPasswordPrompt(false)
    setAdminPassword('')
    setAdminPasswordError('')
    setIsValidatingAdminPassword(false)
  }

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault()

    const email = session?.user?.email
    if (!email) {
      setAdminPasswordError('No se pudo validar la cuenta actual. Vuelve a iniciar sesión.')
      return
    }

    setIsValidatingAdminPassword(true)
    setAdminPasswordError('')

    try {
      const result = await signIn('credentials', {
        email,
        password: adminPassword,
        redirect: false,
        callbackUrl: '/admin',
      })

      if (result?.error) {
        setAdminPasswordError('La contraseña no es correcta.')
        return
      }

      closeAdminPasswordPrompt()
      router.push('/admin')
      router.refresh()
    } catch {
      setAdminPasswordError('No se pudo validar la contraseña. Inténtalo de nuevo.')
    } finally {
      setIsValidatingAdminPassword(false)
    }
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
        const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
        await adapter.speak(phrase, profile?.id || '')
      }

      // Save to local history
      if (profile) {
        const localPhrase: Phrase = {
          id: `local-${Date.now()}`,
          profileId: profile.id,
          text: phrase,
          symbolsUsed: symbols.map(s => ({ id: s.id, label: s.label })),
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
  }, [symbols, profile, isSpeaking, onPhraseSaved, conjugatePhrase, speakPhrase])

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

        <div className="min-h-[92px] min-w-0 flex-1 rounded-[1.75rem] border border-white/10 bg-[var(--phrase-inner)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:border-slate-700/80">
          {symbols.length > 0 ? (
            <div className="flex items-center gap-2 overflow-hidden flex-wrap">
              {symbols.map((symbol, i) => (
                <div
                  key={`preview-${symbol.id}-${i}`}
                  className="ui-chip inline-flex min-w-[72px] flex-col items-center justify-center rounded-2xl px-3 py-2"
                >
                  <span className="text-2xl sm:text-3xl leading-none">{symbol.emoji || '📝'}</span>
                  <span className="mt-1 text-[11px] sm:text-xs font-semibold text-white text-center leading-tight">
                    {symbol.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-200/90 dark:text-slate-300 sm:text-base">
              Toca los simbolos para construir una frase...
            </p>
          )}
          {conjugated && (
            <p className="mt-2 truncate text-[11px] sm:text-xs text-indigo-100/90">
              Frase: {previewText}
            </p>
          )}
        </div>

        <button
          onClick={handleSpeak}
          disabled={symbols.length === 0 || isSpeaking}
          type="button"
          className={`ui-primary-button h-14 w-14 shrink-0 rounded-[1.6rem] grid place-items-center transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20 ${isSpeaking ? 'cursor-wait saturate-75' : ''}`}
          aria-label="Reproducir frase"
        >
          <Play className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        </button>

        <button
          onClick={handleDeleteLastClick}
          disabled={symbols.length === 0}
          type="button"
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Eliminar ultima palabra"
        >
          <RotateCcw className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>

        <button
          onClick={handleClearAllClick}
          disabled={symbols.length === 0}
          type="button"
          className="ui-icon-button grid h-14 w-14 shrink-0 place-items-center rounded-2xl transition-all disabled:opacity-40 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] lg:h-20 lg:w-20"
          aria-label="Borrar todo"
        >
          <Trash2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        </button>
        </div>
      </div>

      {showAdminPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl" style={{ background: 'var(--app-modal-backdrop)' }}>
          <div className="ui-modal-panel w-full max-w-sm rounded-[2rem] p-6 text-[var(--app-foreground)]">
            <h2 className="text-xl font-bold text-[var(--app-foreground)]">Acceso al panel admin</h2>
            <p className="mt-2 text-sm text-[var(--app-muted-foreground)]">
              Introduce la contraseña de la cuenta actual para continuar.
            </p>

            <form onSubmit={handleAdminAccess} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="text-sm font-medium text-[var(--app-foreground)]">
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                  required
                  className="app-input w-full rounded-xl px-4 py-3 text-sm outline-none"
                  placeholder="Tu contraseña"
                />
              </div>

              {adminPasswordError && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-200">
                  {adminPasswordError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeAdminPasswordPrompt}
                  className="ui-secondary-button flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isValidatingAdminPassword || adminPassword.length === 0}
                  className="ui-primary-button flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-70"
                >
                  {isValidatingAdminPassword ? 'Validando...' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
