export type TtsMode = 'browser' | 'preset' | 'custom'

export type UserPlan = 'free' | 'pro'

export type VoiceGender = 'male' | 'female'

export type ElevenLabsPresetVoice = {
  id: string
  name: string
  gender: VoiceGender
  elevenVoiceId: string
}
