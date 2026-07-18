'use client'

import { useCallback, useEffect, useState } from 'react'

type WaitlistRow = {
  id: string
  name: string
  email: string
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

function toWaitlistCsv(rows: WaitlistRow[]): string {
  const header = ['id', 'fecha', 'nombre', 'email']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [r.id, r.createdAt, r.name, r.email].map((c) => escapeCsvCell(c)).join(','),
    ),
  ]
  return lines.join('\n')
}

export function StatsWaitlistClient() {
  const [rows, setRows] = useState<WaitlistRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/captations', { credentials: 'same-origin' })
      if (!res.ok) return
      const json = (await res.json()) as { waitlist: WaitlistRow[] }
      setRows(json.waitlist)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">
            Captaciones
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Waitlist</h1>
        </div>
        <button
          type="button"
          onClick={() => downloadText('waitlist.csv', toWaitlistCsv(rows), 'text/csv')}
          disabled={rows.length === 0}
          className="rounded-full bg-[#FE6B45] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-40"
        >
          Descargar CSV
        </button>
      </header>

      {loading ? <p className="text-sm text-[#042D22]/50">Cargando…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm font-medium text-[#042D22]/50">Aún no hay inscripciones.</p>
      ) : null}

      <ul className="divide-y divide-black/[0.06] rounded-2xl border border-black/10 bg-white px-5 shadow-sm">
        {rows.map((w) => (
          <li key={w.id} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
            <div>
              <p className="text-sm font-extrabold text-[#042D22]">{w.name}</p>
              <p className="text-sm font-medium text-[#042D22]/70">{w.email}</p>
            </div>
            <time className="text-xs font-bold text-[#042D22]/50" dateTime={w.createdAt}>
              {fmtDate(w.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  )
}
