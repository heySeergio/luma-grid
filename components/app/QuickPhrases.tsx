'use client'

import { Volume2 } from 'lucide-react'
import { stopAllTtsPlayback } from '@/lib/voice/speakClient'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Phrase, Profile } from '@/lib/supabase/types'

interface Props {
  phrases: Phrase[]
  profile: Profile | null
  onSpeak: (phrase: Phrase) => void
  /** Si existe, sustituye Web Speech al reproducir el texto. */
  speakText?: (text: string) => Promise<void>
}

export default function QuickPhrases({ phrases, profile, onSpeak, speakText }: Props) {
  const visiblePhrases = phrases.slice(0, 4)

  const handleSpeak = async (phrase: Phrase) => {
    if (speakText) {
      await speakText(phrase.text)
    } else {
      stopAllTtsPlayback()
      const adapter = new WebSpeechAdapter()
      await adapter.speak(phrase.text, profile?.id || '')
    }
    onSpeak(phrase)
  }

  return (
    <div className="shrink-0 px-3 pt-3">
      <div className="ui-toolbar-shell flex flex-wrap items-center gap-1.5 overflow-hidden rounded-[1.6rem] px-3 py-2">
        <span className="ui-soft-badge shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold">⭐ Rápidas</span>
        {visiblePhrases.map(phrase => (
          <button
            key={phrase.id}
            onClick={() => handleSpeak(phrase)}
            className="ui-chip flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
          >
            <Volume2 size={12} />
            {phrase.text}
          </button>
        ))}
      </div>
    </div>
  )
}
