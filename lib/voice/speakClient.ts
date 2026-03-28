'use client'

import type { TtsMode } from '@/lib/tts/types'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'

export type SpeakVoicePrefs = {
  ttsMode: TtsMode
  voiceId?: string | null
}

let currentAudio: HTMLAudioElement | null = null

/** Mismo límite que en /api/tts: si la petición tarda demasiado, se usa voz del navegador. */
const ELEVENLABS_FETCH_TIMEOUT_MS = 7_000

async function speakWithWebSpeech(text: string, profileId: string): Promise<void> {
  try {
    const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
    await adapter.speak(text, profileId)
  } catch {
    /* Evita rechazos no capturados si Web Speech falla (p. ej. sin voces). */
  }
}

export function stopAllTtsPlayback(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * TTS unificado: navegador (gratis) o audio desde POST /api/tts (ElevenLabs).
 */
export async function speakText(
  text: string,
  profileId: string,
  prefs: SpeakVoicePrefs,
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return

  stopAllTtsPlayback()

  if (prefs.ttsMode === 'browser') {
    await speakWithWebSpeech(trimmed, profileId)
    return
  }

  const ac = new AbortController()
  const timeoutId = window.setTimeout(() => ac.abort(), ELEVENLABS_FETCH_TIMEOUT_MS)

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text: trimmed }),
      signal: ac.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
      if (err.code === 'BROWSER_MODE' || err.code === 'ELEVENLABS_TIMEOUT' || res.status === 504) {
        await speakWithWebSpeech(trimmed, profileId)
        return
      }
      throw new Error(typeof err.error === 'string' ? err.error : 'Error TTS')
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        reject(new Error('Audio'))
      }
      void audio.play().catch(reject)
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const aborted =
      (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError')
    if (aborted && process.env.NODE_ENV === 'development') {
      console.warn('[speakText] TTS ElevenLabs lento o cancelado; usando voz del navegador.')
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[speakText] Fallo TTS (red o API); intentando voz del sistema.', err)
    }
    await speakWithWebSpeech(trimmed, profileId)
  }
}
