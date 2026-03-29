'use client'

import type { TtsMode } from '@/lib/tts/types'
import { closeAudioContextSafe, connectAudioElementGain } from '@/lib/voice/audioGain'
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
 * Margen por encima del timeout del servidor (/api/tts ~7s a ElevenLabs) para no abortar
 * la petición HTTP antes de recibir 504 + código ELEVENLABS_TIMEOUT.
 */
const ELEVENLABS_FETCH_TIMEOUT_MS = 20_000

function isNaturalTtsMode(prefs: SpeakVoicePrefs): boolean {
  return prefs.ttsMode === 'preset' || prefs.ttsMode === 'custom'
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
 * Con voz natural (preset/custom), la voz del sistema solo se usa si ElevenLabs falla de verdad
 * (respuesta de error, audio que no reproduce, etc.), no por timeout agresivo del cliente.
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
      if (err.code === 'BROWSER_MODE' || err.code === 'ELEVENLABS_TIMEOUT' || res.status === 504) {
        if (!stillActive()) return
        // Solo voz del sistema cuando el servidor indica fallback o timeout real de ElevenLabs.
        await speakWithWebSpeech(trimmed, profileId, stillActive)
        return
      }
      throw new Error(typeof err.error === 'string' ? err.error : 'Error TTS')
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
    const aborted =
      (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError')

    // Modo natural: no usar voz del sistema solo porque el fetch del cliente hizo abort (timeout local).
    if (isNaturalTtsMode(prefs) && aborted) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[speakText] Petición TTS abortada en cliente; modo natural: no se usa voz del sistema.')
      }
      return
    }

    if (aborted && process.env.NODE_ENV === 'development') {
      console.warn('[speakText] TTS ElevenLabs lento o cancelado; usando voz del navegador.')
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[speakText] Fallo TTS (red o API); intentando voz del sistema.', err)
    }
    if (!stillActive()) return
    await speakWithWebSpeech(trimmed, profileId, stillActive)
  }
}
