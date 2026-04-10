'use client'

import { Sparkles } from 'lucide-react'
import type { PhraseCompletionChip } from '@/app/actions/phraseCompletion'

type Props = {
  chips: PhraseCompletionChip[]
  onPick: (symbolId: string) => void
  disabled?: boolean
}

export default function PhraseCompletionChips({ chips, onPick, disabled }: Props) {
  if (chips.length === 0) return null

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200/90 bg-slate-50/90 px-3 py-2.5 dark:border-white/10 dark:bg-[var(--phrase-inner)]/40 md:px-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" aria-hidden />
        Siguiente
      </span>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c.id)}
          className="rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 dark:border-indigo-500/35 dark:bg-indigo-950/50 dark:text-indigo-100 dark:hover:bg-indigo-500/15"
        >
          + {c.label}
        </button>
      ))}
    </div>
  )
}
