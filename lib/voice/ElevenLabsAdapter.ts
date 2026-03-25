import md5 from 'md5'
import { db } from '@/lib/dexie/db'
import type { VoiceAdapter, Voice } from './VoiceAdapter'

export class ElevenLabsAdapter implements VoiceAdapter {
  private apiKey: string
  private voiceId: string
  private rate: number
  private stability: number
  private audioCache = new Map<string, HTMLAudioElement>()

  constructor(apiKey: string, voiceId: string, rate = 1.0, stability = 0.5) {
    this.apiKey = apiKey
    this.voiceId = voiceId
    this.rate = rate
    this.stability = stability
  }

  private getCacheKey(text: string): string {
    return md5(`${text}:${this.voiceId}`)
  }

  async speak(text: string, profileId: string): Promise<void> {
    const hash = this.getCacheKey(text)

    // Check IndexedDB cache first
    const cached = await db.audioCache
      .where('hash').equals(hash)
      .and(e => e.voiceId === this.voiceId)
      .first()

    let audioBlob: Blob

    if (cached) {
      audioBlob = cached.blob
      // Update last used
      await db.audioCache.update(cached.id!, { lastUsedAt: Date.now() })
    } else {
      // Call ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: this.stability,
              similarity_boost: 0.75,
              speed: this.rate,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`)
      }

      audioBlob = await response.blob()

      // Save to cache
      await db.audioCache.add({
        hash,
        voiceId: this.voiceId,
        profileId,
        blob: audioBlob,
        text,
        sizeBytes: audioBlob.size,
        lastUsedAt: Date.now(),
        createdAt: Date.now(),
      })
    }

    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Audio playback failed'))
      }
      audio.play().catch(reject)
    })
  }

  getVoices(): Voice[] {
    // Voices fetched separately via API
    return []
  }

  stop(): void {
    // Cancel current audio if playing
  }

  async pregenerate(texts: string[], profileId: string): Promise<void> {
    for (const text of texts) {
      try {
        await this.speak(text, profileId)
      } catch (e) {
        console.error(`Failed to pregenerate: ${text}`, e)
      }
    }
  }
}
