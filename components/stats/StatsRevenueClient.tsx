'use client'

import { useCallback, useEffect, useState } from 'react'
import { MetricBars, StatsKpi, StatsSection } from '@/components/stats/StatsUi'
import { formatEurFromCents } from '@/lib/stats/format'

type Overview = {
  mrrCents: number
  activeSubscriptions: number
  trialingSubscriptions: number
  canceledLast30Days: number
  revenueLast30DaysCents: number
  byPlan: { plan: string; count: number; mrrCents: number }[]
}

type SubRow = {
  id: string
  status: string
  customerEmail: string | null
  plan: string
  mrrCents: number
  currentPeriodEnd: number | null
}

export function StatsRevenueClient() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [subs, setSubs] = useState<SubRow[]>([])
  const [configured, setConfigured] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [oRes, sRes] = await Promise.all([
        fetch('/api/stats/stripe/overview', { credentials: 'same-origin' }),
        fetch('/api/stats/stripe/subscriptions', { credentials: 'same-origin' }),
      ])
      const oJson = (await oRes.json().catch(() => ({}))) as {
        configured?: boolean
        overview?: Overview
        error?: string
      }
      const sJson = (await sRes.json().catch(() => ({}))) as {
        configured?: boolean
        subscriptions?: SubRow[]
        error?: string
      }
      setConfigured(Boolean(oJson.configured))
      setOverview(oJson.overview ?? null)
      setSubs(sJson.subscriptions ?? [])
      if (!oRes.ok) setError(oJson.error ?? 'Error al cargar Stripe')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">Stripe</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Ingresos</h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-[#042D22]/60">
          MRR, suscripciones activas e ingresos recientes.
        </p>
      </header>

      {loading ? <p className="text-sm text-[#042D22]/50">Cargando…</p> : null}

      {!configured && !loading ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Stripe no configurado ({error || 'falta STRIPE_SECRET_KEY'}).
        </p>
      ) : null}

      {overview ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsKpi label="MRR" value={formatEurFromCents(overview.mrrCents)} />
          <StatsKpi label="Activas" value={String(overview.activeSubscriptions)} />
          <StatsKpi label="Trial" value={String(overview.trialingSubscriptions)} />
          <StatsKpi
            label="Cobrado 30d"
            value={formatEurFromCents(overview.revenueLast30DaysCents)}
            hint={`Canceladas 30d: ${overview.canceledLast30Days}`}
          />
        </div>
      ) : null}

      {overview ? (
        <StatsSection title="Por plan">
          <MetricBars
            items={overview.byPlan.map((p) => ({
              x: `${p.plan} (${p.count})`,
              y: Math.round(p.mrrCents / 100),
            }))}
            empty="Sin suscripciones activas."
          />
          <p className="mt-2 text-xs text-[#042D22]/45">Barras en euros de MRR aproximado.</p>
        </StatsSection>
      ) : null}

      <StatsSection title="Suscripciones recientes">
        {subs.length === 0 ? (
          <p className="text-sm text-[#042D22]/50">Sin datos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs uppercase tracking-wider text-[#042D22]/45">
                  <th className="py-2 pr-3 font-extrabold">Cliente</th>
                  <th className="py-2 pr-3 font-extrabold">Plan</th>
                  <th className="py-2 pr-3 font-extrabold">Estado</th>
                  <th className="py-2 pr-3 font-extrabold">MRR</th>
                  <th className="py-2 font-extrabold">Periodo</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-black/[0.06]">
                    <td className="py-2.5 pr-3 font-medium">{s.customerEmail || s.id}</td>
                    <td className="py-2.5 pr-3 font-semibold capitalize">{s.plan}</td>
                    <td className="py-2.5 pr-3">{s.status}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{formatEurFromCents(s.mrrCents)}</td>
                    <td className="py-2.5 text-[#042D22]/60">
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd * 1000).toLocaleDateString('es-ES')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StatsSection>
    </div>
  )
}
