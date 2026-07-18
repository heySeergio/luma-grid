'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DaysSelect, StatsKpi, StatsSection } from '@/components/stats/StatsUi'
import { formatEurFromCents } from '@/lib/stats/format'

type UmamiStats = {
  pageviews: number
  visitors: number
  visits: number
  bounces: number
}

type StripeOverview = {
  mrrCents: number
  activeSubscriptions: number
  trialingSubscriptions: number
  canceledLast30Days: number
  revenueLast30DaysCents: number
}

function publicHref(href: string): string {
  if (typeof window === 'undefined') return href
  const host = window.location.hostname.toLowerCase()
  if (host === 'stats.lumagrid.app' || host.startsWith('stats.')) {
    if (href === '/stats') return '/'
    if (href.startsWith('/stats/')) return href.slice('/stats'.length)
  }
  return href
}

export function StatsOverviewClient() {
  const [days, setDays] = useState(30)
  const [umami, setUmami] = useState<{ configured: boolean; stats: UmamiStats | null; error?: string }>({
    configured: false,
    stats: null,
  })
  const [stripe, setStripe] = useState<{
    configured: boolean
    overview: StripeOverview | null
    error?: string
  }>({ configured: false, overview: null })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [uRes, sRes] = await Promise.all([
        fetch(`/api/stats/umami/overview?days=${days}`, { credentials: 'same-origin' }),
        fetch('/api/stats/stripe/overview', { credentials: 'same-origin' }),
      ])
      const uJson = (await uRes.json().catch(() => ({}))) as {
        configured?: boolean
        stats?: UmamiStats
        error?: string
      }
      const sJson = (await sRes.json().catch(() => ({}))) as {
        configured?: boolean
        overview?: StripeOverview
        error?: string
      }
      setUmami({
        configured: Boolean(uJson.configured),
        stats: uJson.stats ?? null,
        error: uRes.ok ? undefined : uJson.error,
      })
      setStripe({
        configured: Boolean(sJson.configured),
        overview: sJson.overview ?? null,
        error: sRes.ok ? undefined : sJson.error,
      })
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  const bounceRate =
    umami.stats && umami.stats.visits > 0
      ? `${Math.round((umami.stats.bounces / umami.stats.visits) * 100)}%`
      : '—'

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">
            Panel interno
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Overview</h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-[#042D22]/60">
            Tráfico web (Umami) e ingresos (Stripe) en un vistazo.
          </p>
        </div>
        <DaysSelect value={days} onChange={setDays} />
      </header>

      {loading ? (
        <p className="text-sm font-medium text-[#042D22]/50">Cargando métricas…</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsKpi
          label="Visitantes"
          value={umami.stats ? String(umami.stats.visitors) : '—'}
          hint={umami.configured ? `${days} días` : 'Umami no configurado'}
        />
        <StatsKpi
          label="Pageviews"
          value={umami.stats ? String(umami.stats.pageviews) : '—'}
          hint={umami.error}
        />
        <StatsKpi label="Bounce rate" value={bounceRate} />
        <StatsKpi
          label="MRR"
          value={stripe.overview ? formatEurFromCents(stripe.overview.mrrCents) : '—'}
          hint={stripe.configured ? 'Suscripciones activas' : 'Stripe no configurado'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatsSection
          title="Stripe"
          action={
            <Link href={publicHref('/stats/revenue')} className="text-sm font-bold underline-offset-2 hover:underline">
              Ver ingresos →
            </Link>
          }
        >
          {stripe.overview ? (
            <ul className="space-y-2 text-sm font-medium text-[#042D22]/80">
              <li>
                Activas:{' '}
                <strong className="font-extrabold">{stripe.overview.activeSubscriptions}</strong>
              </li>
              <li>
                En trial:{' '}
                <strong className="font-extrabold">{stripe.overview.trialingSubscriptions}</strong>
              </li>
              <li>
                Canceladas (30d):{' '}
                <strong className="font-extrabold">{stripe.overview.canceledLast30Days}</strong>
              </li>
              <li>
                Cobrado (30d):{' '}
                <strong className="font-extrabold">
                  {formatEurFromCents(stripe.overview.revenueLast30DaysCents)}
                </strong>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-[#042D22]/50">
              {stripe.error || 'Configura STRIPE_SECRET_KEY para ver ingresos.'}
            </p>
          )}
        </StatsSection>

        <StatsSection
          title="Tráfico web"
          action={
            <Link href={publicHref('/stats/web')} className="text-sm font-bold underline-offset-2 hover:underline">
              Ver tráfico →
            </Link>
          }
        >
          {umami.stats ? (
            <ul className="space-y-2 text-sm font-medium text-[#042D22]/80">
              <li>
                Visitas: <strong className="font-extrabold">{umami.stats.visits}</strong>
              </li>
              <li>
                Visitantes únicos:{' '}
                <strong className="font-extrabold">{umami.stats.visitors}</strong>
              </li>
              <li>
                Pageviews: <strong className="font-extrabold">{umami.stats.pageviews}</strong>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-[#042D22]/50">
              {umami.error ||
                'Configura UMAMI_API_KEY y UMAMI_WEBSITE_ID. Añade el script de tracking en la web.'}
            </p>
          )}
        </StatsSection>
      </div>
    </div>
  )
}
