'use client'

import { useCallback, useEffect, useState } from 'react'
import { DaysSelect, MetricBars, StatsKpi, StatsSection } from '@/components/stats/StatsUi'

type Metric = { x: string; y: number }

type WebPayload = {
  configured?: boolean
  error?: string
  stats?: {
    pageviews: number
    visitors: number
    visits: number
    bounces: number
  }
  countries?: Metric[]
  regions?: Metric[]
  cities?: Metric[]
  paths?: Metric[]
  referrers?: Metric[]
  devices?: Metric[]
  browsers?: Metric[]
  pageviews?: {
    pageviews: { t: string; y: number }[]
  }
}

export function StatsWebClient() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<WebPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats/umami/web?days=${days}`, { credentials: 'same-origin' })
      const json = (await res.json().catch(() => ({}))) as WebPayload
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const series = data?.pageviews?.pageviews ?? []
  const maxY = Math.max(...series.map((p) => p.y), 1)

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">Umami</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Tráfico web</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-[#042D22]/60">
            Páginas, referrers y procedencia geográfica de los visitantes.
          </p>
        </div>
        <DaysSelect value={days} onChange={setDays} />
      </header>

      {loading ? <p className="text-sm text-[#042D22]/50">Cargando…</p> : null}

      {!data?.configured && !loading ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Umami no está configurado. Define <code className="font-mono">UMAMI_API_KEY</code> y{' '}
          <code className="font-mono">UMAMI_WEBSITE_ID</code> en Vercel.
          {data?.error ? ` (${data.error})` : null}
        </p>
      ) : null}

      {data?.stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsKpi label="Visitantes" value={String(data.stats.visitors)} />
          <StatsKpi label="Visitas" value={String(data.stats.visits)} />
          <StatsKpi label="Pageviews" value={String(data.stats.pageviews)} />
          <StatsKpi
            label="Bounce"
            value={
              data.stats.visits > 0
                ? `${Math.round((data.stats.bounces / data.stats.visits) * 100)}%`
                : '—'
            }
          />
        </div>
      ) : null}

      {series.length > 0 ? (
        <StatsSection title="Pageviews en el tiempo">
          <div className="flex h-40 items-end gap-1">
            {series.map((p) => (
              <div
                key={p.t}
                title={`${p.t}: ${p.y}`}
                className="min-w-0 flex-1 rounded-t bg-[#042D22]/85"
                style={{ height: `${Math.max(4, (p.y / maxY) * 100)}%` }}
              />
            ))}
          </div>
        </StatsSection>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection title="Países">
          <MetricBars items={data?.countries ?? []} empty="Sin datos de país aún." />
        </StatsSection>
        <StatsSection title="Regiones">
          <MetricBars items={data?.regions ?? []} empty="Sin datos de región aún." />
        </StatsSection>
        <StatsSection title="Ciudades">
          <MetricBars items={data?.cities ?? []} empty="Sin datos de ciudad aún." />
        </StatsSection>
        <StatsSection title="Páginas">
          <MetricBars items={data?.paths ?? []} empty="Sin páginas aún." />
        </StatsSection>
        <StatsSection title="Referrers">
          <MetricBars items={data?.referrers ?? []} empty="Sin referrers aún." />
        </StatsSection>
        <StatsSection title="Dispositivos y navegadores">
          <div className="grid gap-6 sm:grid-cols-2">
            <MetricBars items={data?.devices ?? []} empty="Sin dispositivos." />
            <MetricBars items={data?.browsers ?? []} empty="Sin navegadores." />
          </div>
        </StatsSection>
      </div>
    </div>
  )
}
