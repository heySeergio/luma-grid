'use client'

import { useCallback, useEffect, useState } from 'react'

type FeedbackRow = {
  id: string
  anonymous: boolean
  email: string | null
  message: string
  createdAt: string
}

function escapeCsvCell(value: string): string {
  const s = value.replace(/\r\n/g, '\n')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([`\ufeff${text}`], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toFeedbackCsv(rows: FeedbackRow[]): string {
  const header = ['id', 'fecha', 'anonimo', 'email', 'mensaje']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [r.id, r.createdAt, r.anonymous ? 'si' : 'no', r.email ?? '', r.message]
        .map((c) => escapeCsvCell(c))
        .join(','),
    ),
  ]
  return lines.join('\n')
}

export function StatsFeedbackClient() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/captations', { credentials: 'same-origin' })
      if (!res.ok) return
      const json = (await res.json()) as { feedback: FeedbackRow[] }
      setRows(json.feedback)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/stats/feedback/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) setRows((prev) => prev.filter((f) => f.id !== id))
    } finally {
      setDeleteId(null)
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">
            Captaciones
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Feedback</h1>
        </div>
        <button
          type="button"
          onClick={() => downloadText('feedbacks.csv', toFeedbackCsv(rows), 'text/csv')}
          disabled={rows.length === 0}
          className="rounded-full bg-[#042D22] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-40"
        >
          Descargar CSV
        </button>
      </header>

      {loading ? <p className="text-sm text-[#042D22]/50">Cargando…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm font-medium text-[#042D22]/50">Aún no hay opiniones guardadas.</p>
      ) : null}

      <ul className="space-y-4">
        {rows.map((f) => (
          <li key={f.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-xs font-bold text-[#042D22]/55">
                <time dateTime={f.createdAt}>{fmtDate(f.createdAt)}</time>
                {f.anonymous ? (
                  <span className="ml-2 rounded-full bg-[#FFEB3B] px-2.5 py-0.5 text-[11px] font-extrabold text-[#042D22]">
                    Anónimo
                  </span>
                ) : (
                  <span className="ml-2 font-semibold text-[#042D22]/80">{f.email}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadText(`feedback-${f.id}.csv`, toFeedbackCsv([f]), 'text/csv')
                  }
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-extrabold"
                >
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  disabled={deleteId === f.id}
                  className="rounded-full border border-red-200 px-4 py-2 text-xs font-extrabold text-red-600 disabled:opacity-50"
                >
                  {deleteId === f.id ? 'Borrando…' : 'Borrar'}
                </button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#042D22]/90">
              {f.message}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
