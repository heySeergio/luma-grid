'use client'

import type { TtsMode } from '@/lib/tts/types'
import { closeAudioContextSafe, connectAudioElementGain } from '@/lib/voice/audioGain'
import { stopTapAudioElement } from '@/lib/voice/tapAudioElement'
import { getPresetPlaybackGain } from '@/lib/voice/elevenlabsPresets'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'

export type SpeakVoicePrefs = {
  ttsMode: TtsMode
  voiceId?: string | null
}

let currentAudio: HTMLAudioElement | null = null
let currentGainContext: AudioContext | null = null

/**
 * Se incrementa en `stopAllTtsPlayback` y al iniciar cada `speakText`, para que peticiones
 * o fallbacks antiguos no reproduzcan audio ni Web Speech encima de una lectura nueva.
 */
let speakSessionId = 0

/**
 * Si `/api/tts` no responde en este tiempo (modo ElevenLabs), se usa la voz del sistema.
 * Alineado con el timeout del servidor hacia ElevenLabs.
 */
const ELEVENLABS_FETCH_TIMEOUT_MS = 5_000

function isNaturalTtsMode(prefs: SpeakVoicePrefs): boolean {
  return prefs.ttsMode === 'preset' || prefs.ttsMode === 'custom'
}

function isAbortError(err: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  )
}

function cancelBrowserSpeechOnly(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Corta audio ElevenLabs (y Web Speech) sin tocar `speakSessionId`.
 * Útil antes de un fallback a voz del sistema para no solapar ambas.
 */
function stopElevenLabsPlaybackHard(): void {
  closeAudioContextSafe(currentGainContext)
  currentGainContext = null
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.src = ''
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
  cancelBrowserSpeechOnly()
}

async function speakWithWebSpeech(
  text: string,
  profileId: string,
  stillActive: () => boolean,
): Promise<void> {
  if (!stillActive()) return
  stopElevenLabsPlaybackHard()
  try {
    if (!stillActive()) return
    const adapter = new WebSpeechAdapter(undefined, 1.0, 1.0)
    if (!stillActive()) return
    await adapter.speak(text, profileId)
  } catch {
    /* Evita rechazos no capturados si Web Speech falla (p. ej. sin voces). */
  }
}

export function stopAllTtsPlayback(): void {
  speakSessionId++
  stopTapAudioElement()
  closeAudioContextSafe(currentGainContext)
  currentGainContext = null
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.src = ''
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
  cancelBrowserSpeechOnly()
}

/**
 * TTS unificado: navegador (gratis) o audio desde POST /api/tts (ElevenLabs).
 * Con voz natural (preset/custom), la voz del sistema solo se usa si no hay respuesta
 * de la API en 5s (timeout) o el servidor indica modo navegador / timeout de ElevenLabs.
 * Otros errores (red, 5xx, audio) no caen a Web Speech.
 */
export async function speakText(
  text: string,
  profileId: string,
  prefs: SpeakVoicePrefs,
): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return

  stopAllTtsPlayback()
  const mySessionId = speakSessionId
  const stillActive = () => mySessionId === speakSessionId

  if (prefs.ttsMode === 'browser') {
    if (!stillActive()) return
    await speakWithWebSpeech(trimmed, profileId, stillActive)
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

    if (!stillActive()) return

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
      const allowBrowserFallback =
        err.code === 'BROWSER_MODE' || err.code === 'ELEVENLABS_TIMEOUT' || res.status === 504
      if (allowBrowserFallback) {
        if (!stillActive()) return
        await speakWithWebSpeech(trimmed, profileId, stillActive)
        return
      }
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[speakText] Error TTS sin fallback a voz del sistema (modo natural).',
          err.error ?? res.status,
        )
      }
      return
    }

    const blob = await res.blob()

    if (!stillActive()) return

    const url = URL.createObjectURL(blob)
    if (!stillActive()) {
      URL.revokeObjectURL(url)
      return
    }

    cancelBrowserSpeechOnly()
    const audio = new Audio(url)
    currentAudio = audio
    const gain = getPresetPlaybackGain(prefs.voiceId)
    currentGainContext = connectAudioElementGain(audio, gain)

    await new Promise<void>((resolve, reject) => {
      const cleanupGain = () => {
        if (currentGainContext) {
          closeAudioContextSafe(currentGainContext)
          currentGainContext = null
        }
      }
      audio.onended = () => {
        cleanupGain()
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        resolve()
      }
      audio.onerror = () => {
        cleanupGain()
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        reject(new Error('Audio'))
      }
      void audio.play().catch((e) => {
        cleanupGain()
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        reject(e)
      })
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (!stillActive()) return

    // Único fallback a voz del sistema en modo natural: sin respuesta de /api/tts en 5s.
    if (isNaturalTtsMode(prefs) && isAbortError(err)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[speakText] Sin respuesta TTS en 5s; usando voz del navegador.')
      }
      if (!stillActive()) return
      await speakWithWebSpeech(trimmed, profileId, stillActive)
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('[speakText] Fallo TTS (red/API/audio); sin fallback a voz del sistema.', err)
    }
  }
}
