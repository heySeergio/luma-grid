'use client'

import { useCallback, useState } from 'react'
import type { HealthCheckResult } from '@/lib/intranet/health'
import { formatDateTime } from '@/lib/intranet/format'

type Props = {
  initialChecks: HealthCheckResult[]
}

function statusIcon(status: HealthCheckResult['status']) {
  if (status === 'ok') return '✓'
  if (status === 'degraded') return '⚠'
  return '✗'
}

function statusClass(status: HealthCheckResult['status']) {
  if (status === 'ok') return 'text-emerald-700 bg-emerald-50'
  if (status === 'degraded') return 'text-amber-800 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

export function SystemHealthPanel({ initialChecks }: Props) {
  const [checks, setChecks] = useState(initialChecks)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/intranet/health')
      if (res.ok) {
        const json = (await res.json()) as { checks: HealthCheckResult[] }
        setChecks(json.checks)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="rounded-xl bg-[#042D22] px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60"
      >
        {loading ? 'Comprobando…' : 'Actualizar checks'}
      </button>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((c) => (
          <div
            key={c.service}
            className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-[#042D22]">{c.service}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusClass(c.status)}`}
              >
                {statusIcon(c.status)} {c.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#042D22]/70">{c.durationMs} ms</p>
            {c.message ? (
              <p className="mt-1 text-xs text-red-600">{c.message}</p>
            ) : null}
            <p className="mt-2 text-xs text-[#042D22]/40">
              {formatDateTime(c.checkedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
