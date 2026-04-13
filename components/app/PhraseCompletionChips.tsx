'use client'

import { Sparkles } from 'lucide-react'
import type { PhraseCompletionChip } from '@/app/actions/phraseCompletion'

type Props = {
  chips: PhraseCompletionChip[]
  onPick: (symbolId: string) => void
  disabled?: boolean
}

export default function PhraseCompletionChips({ chips, onPick, disabled }: Props) {
  return (
    <div className="flex min-h-[2.75rem] shrink-0 flex-wrap items-center gap-2 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface-muted)_92%,white)] px-3 py-2.5 dark:bg-[color-mix(in_srgb,var(--phrase-inner)_82%,var(--app-bg))] md:px-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--app-muted-foreground)]">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" aria-hidden />
        Siguiente
      </span>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(c.id)}
          className="rounded-full border border-indigo-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 dark:border-indigo-400/30 dark:bg-[color-mix(in_srgb,var(--app-surface-elevated)_94%,var(--accent))] dark:text-indigo-100 dark:hover:border-indigo-400/45 dark:hover:bg-[color-mix(in_srgb,var(--app-surface-elevated)_88%,var(--accent))]"
        >
          + {c.label}
        </button>
      ))}
    </div>
  )
}
