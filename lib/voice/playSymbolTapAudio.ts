'use client'

import { stopAllTtsPlayback } from '@/lib/voice/speakClient'
import { playTapAudioElement, stopTapAudioElement } from '@/lib/voice/tapAudioElement'

export { stopTapAudioElement as stopSymbolTapAudio }

/**
 * Reproduce el clip de toque de una celda. No usa TTS.
 * Cancela cualquier clip o TTS en curso.
 */
export async function playSymbolTapAudio(url: string): Promise<void> {
  stopAllTtsPlayback()
  await playTapAudioElement(url)
}
