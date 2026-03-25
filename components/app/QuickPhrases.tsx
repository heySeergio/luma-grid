'use client'

import { Volume2 } from 'lucide-react'
import { WebSpeechAdapter } from '@/lib/voice/WebSpeechAdapter'
import type { Phrase, Profile } from '@/lib/supabase/types'

interface Props {
  phrases: Phrase[]
  profile: Profile | null
  onSpeak: (phrase: Phrase) => void
}

export default function QuickPhrases({ phrases, profile, onSpeak }: Props) {
  const visiblePhrases = phrases.slice(0, 4)

  const handleSpeak = async (phrase: Phrase) => {
    const adapter = new WebSpeechAdapter()
    await adapter.speak(phrase.text, profile?.id || '')
    onSpeak(phrase)
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-2 py-1.5 shrink-0">
      <div className="flex items-center gap-1.5 overflow-hidden flex-wrap">
        <span className="text-amber-700 text-xs font-semibold whitespace-nowrap shrink-0">⭐ Rápidas:</span>
        {visiblePhrases.map(phrase => (
          <button
            key={phrase.id}
            onClick={() => handleSpeak(phrase)}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full text-sm font-medium text-amber-900 whitespace-nowrap transition-colors shrink-0"
          >
            <Volume2 size={12} />
            {phrase.text}
          </button>
        ))}
      </div>
    </div>
  )
}
