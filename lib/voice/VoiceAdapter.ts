export interface Voice {
  id: string
  name: string
  lang?: string
  preview_url?: string
}

export interface VoiceAdapter {
  speak(text: string, profileId: string): Promise<void>
  getVoices(): Voice[]
  stop(): void
  pregenerate?(texts: string[], profileId: string): Promise<void>
}

export interface VoiceConfig {
  engine: 'webspeech' | 'elevenlabs'
  systemVoiceId?: string
  systemRate?: number
  systemPitch?: number
  elevenLabsKey?: string
  elevenLabsVoiceId?: string
  elevenLabsRate?: number
  elevenLabsStability?: number
}
