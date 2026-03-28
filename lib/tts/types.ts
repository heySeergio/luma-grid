export type TtsMode = 'browser' | 'preset' | 'custom'

/** @deprecated use SubscriptionPlan from @/lib/subscription/plans */
export type UserPlan = 'free' | 'voice' | 'identity'

export type VoiceGender = 'male' | 'female'

export type ElevenLabsPresetVoice = {
  id: string
  name: string
  gender: VoiceGender
  elevenVoiceId: string
}
