'use client'

import { useMemo, useState } from 'react'
import type { CapturesData } from '@/lib/intranet/captures'
import { downloadText, toFeedbackCsv, type FeedbackCsvRow } from '@/lib/intranet/csv'
import { formatDateTime } from '@/lib/intranet/format'

type FeedbackRow = CapturesData['feedback'][number]

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  suggestion: 'Sugerencia',
  general: 'General',
}

type Props = {
  initialFeedback: FeedbackRow[]
}

export function FeedbackPanel({ initialFeedback }: Props) {
  const [feedback, setFeedback] = useState(initialFeedback)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return feedback
    return feedback.filter((f) => (f.type ?? 'general') === typeFilter)
  }, [feedback, typeFilter])

  const displayName = (f: FeedbackRow) => {
    if (f.anonymous) return 'Anónimo'
    return f.userName ?? f.userEmail ?? f.email ?? '—'
  }

  const removeFeedback = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/intranet/feedback/${id}`, { method: 'DELETE' })
      if (res.ok) setFeedback((prev) => prev.filter((f) => f.id !== id))
    } finally {
      setDeleteId(null)
    }
  }

  const exportCsv = () => {
    const rows: FeedbackCsvRow[] = filtered.map((f) => ({
      id: f.id,
      anonymous: f.anonymous,
      email: f.email,
      message: f.message,
      createdAt: f.createdAt,
      type: f.type,
      rating: f.rating,
    }))
    downloadText('feedbacks.csv', toFeedbackCsv(rows), 'text/csv')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium"
        >
          <option value="all">Todos los tipos</option>
          <option value="bug">Bug</option>
          <option value="suggestion">Sugerencia</option>
          <option value="general">General</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#042D22] hover:bg-[#FDF8EF]"
        >
          Exportar CSV
        </button>
      </div>
      <ul className="space-y-3">
        {filtered.map((f) => (
          <li
            key={f.id}
            className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#042D22]">{displayName(f)}</p>
                <p className="text-xs text-[#042D22]/50">{formatDateTime(f.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                {f.type ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                    {TYPE_LABELS[f.type] ?? f.type}
                  </span>
                ) : null}
                {f.rating != null ? (
                  <span className="text-xs text-[#042D22]/50">★ {f.rating}</span>
                ) : null}
                <button
                  type="button"
                  disabled={deleteId === f.id}
                  onClick={() => removeFeedback(f.id)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#042D22]/85">{f.message}</p>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-black/10 p-8 text-center text-sm text-[#042D22]/50">
            Sin entradas
          </li>
        ) : null}
      </ul>
    </div>
  )
}
