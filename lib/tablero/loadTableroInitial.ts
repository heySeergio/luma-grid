import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { PublicAccountSettings } from '@/app/actions/account'
import { getAccountSettings } from '@/app/actions/account'
import { getProfiles } from '@/app/actions/profiles'
import { getProfileSymbols } from '@/app/actions/symbols'
import { getFrequentPhrases, getPinnedPhrases } from '@/app/actions/phrases'
import { getVoiceSettings } from '@/app/actions/voiceSettings'
import type { TtsMode } from '@/lib/tts/types'
import type { Phrase, Profile, Symbol } from '@/lib/supabase/types'

/** Perfil activo al cargar /tablero (apertura por defecto o primero). */
function pickActiveProfileId(
  profiles: Awaited<ReturnType<typeof getProfiles>>,
): string | null {
  if (profiles.length === 0) return null
  const opening = profiles.find((p) => p.isOpeningProfile)
  return (opening ?? profiles[0]).id
}

export type TableroInitialVoicePrefs = {
  ttsMode: TtsMode
  voiceId: string | null
}

export type TableroInitialPayload = {
  profiles: Profile[]
  activeProfileId: string | null
  symbols: Symbol[]
  pinnedPhrases: Phrase[]
  frequentPhrases: Phrase[]
  accountSettings: PublicAccountSettings | null
  /** Preferencias TTS reales desde el servidor (evita arrancar en modo browser por defecto). */
  voicePrefs: TableroInitialVoicePrefs
}

/**
 * Precarga en el servidor perfiles, cuenta y datos del perfil activo en paralelo
 * para evitar la cascada cliente (perfiles → símbolos/frases).
 */
export async function loadTableroInitial(
  sessionHint?: Session | null,
): Promise<TableroInitialPayload | null> {
  const session = sessionHint ?? (await getServerSession(authOptions))
  if (!session?.user?.id) return null

  const [profiles, accountSettings, voiceSettings] = await Promise.all([
    getProfiles(),
    getAccountSettings(),
    getVoiceSettings(),
  ])

  const activeProfileId = pickActiveProfileId(profiles)

  let symbols: Symbol[] = []
  let pinnedPhrases: Phrase[] = []
  let frequentPhrases: Phrase[] = []

  if (activeProfileId) {
    const showFreq = accountSettings?.showFrequentPhrasesSection !== false
    const [sym, pin, freq] = await Promise.all([
      getProfileSymbols(activeProfileId),
      getPinnedPhrases(activeProfileId),
      showFreq ? getFrequentPhrases(activeProfileId, 5) : Promise.resolve([]),
    ])
    symbols = sym as Symbol[]
    pinnedPhrases = pin as Phrase[]
    frequentPhrases = freq as Phrase[]
  }

  return {
    profiles: profiles as Profile[],
    activeProfileId,
    symbols,
    pinnedPhrases,
    frequentPhrases,
    accountSettings,
    voicePrefs: {
      ttsMode: voiceSettings?.ttsMode ?? 'browser',
      voiceId: voiceSettings?.voiceId ?? null,
    },
  }
}
