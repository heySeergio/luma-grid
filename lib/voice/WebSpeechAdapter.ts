import type { VoiceAdapter, Voice } from './VoiceAdapter'

export class WebSpeechAdapter implements VoiceAdapter {
  private voiceId?: string
  private rate: number
  private pitch: number

  constructor(voiceId?: string, rate = 1.0, pitch = 1.0) {
    this.voiceId = voiceId
    this.rate = rate
    this.pitch = pitch
  }

  async speak(text: string, _profileId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'))
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'es-ES'
      utterance.rate = this.rate
      utterance.pitch = this.pitch

      if (this.voiceId) {
        const voices = window.speechSynthesis.getVoices()
        const voice = voices.find(v => v.voiceURI === this.voiceId || v.name === this.voiceId)
        if (voice) utterance.voice = voice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (e) => reject(new Error(e.error))

      window.speechSynthesis.speak(utterance)
    })
  }

  getVoices(): Voice[] {
    if (!('speechSynthesis' in window)) return []
    return window.speechSynthesis.getVoices()
      .filter(v => v.lang.startsWith('es') || v.lang.startsWith('ES'))
      .map(v => ({ id: v.voiceURI, name: v.name, lang: v.lang }))
  }

  stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }
}
