import { MiniBarChart } from '@/components/intranet/MiniBarChart'
import { IntranetCard } from '@/components/intranet/IntranetCard'
import { SpainGeoMap } from '@/components/intranet/SpainGeoMap'
import { getGeoAnalytics } from '@/lib/intranet/geo-analytics'
import { getNativeAnalytics } from '@/lib/intranet/native-analytics'
import { planLabel, normalizePlanKey } from '@/lib/intranet/plan-labels'

export default async function IntranetAnalyticsPage() {
  const [data, geo] = await Promise.all([getNativeAnalytics(), getGeoAnalytics()])

  const dates = data.dailyActive.map((d) => d.date)
  const maxPlan = Math.max(1, ...data.activityByPlan.map((p) => p.events))
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Analytics</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">
          Uso de la app y procedencia geográfica (últimos 30 días)
        </p>
      </header>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#042D22]">España — mapa de actividad</h2>
        <p className="mt-1 text-xs text-[#042D22]/50">{geo.note}</p>
        {geo.spainRegions.length > 0 ? (
          <div className="mt-6">
            <SpainGeoMap regions={geo.spainRegions} />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-black/10 bg-[#FDF8EF] px-4 py-8 text-center text-sm text-[#042D22]/55">
            Sin datos geo aún. En producción (Vercel) se registran al abrir /tablero o /admin.
          </p>
        )}

        {geo.topCities.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-[#042D22]">Ciudades con más eventos</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {geo.topCities.map((c) => (
                <li
                  key={`${c.city}-${c.regionName}`}
                  className="flex justify-between rounded-xl bg-[#FDF8EF] px-3 py-2 text-sm"
                >
                  <span>
                    {c.city}
                    {c.regionName ? (
                      <span className="text-[#042D22]/45"> · {c.regionName}</span>
                    ) : null}
                  </span>
                  <span className="font-bold">{c.events}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {geo.foreignCountries.length > 0 ? (
          <p className="mt-4 text-xs text-[#042D22]/50">
            Conexiones fuera de España:{' '}
            {geo.foreignCountries.map((f) => `${f.country} (${f.count})`).join(', ')}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#042D22]">Por comunidad autónoma</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
              <th className="py-2">CCAA</th>
              <th className="py-2">Visitas</th>
              <th className="py-2">Pulsaciones</th>
              <th className="py-2">Usuarios</th>
            </tr>
          </thead>
          <tbody>
            {geo.spainRegions.map((r) => (
              <tr key={r.regionCode} className="border-b border-black/[0.04]">
                <td className="py-2.5 font-medium">{r.regionName}</td>
                <td className="py-2.5">{r.pageViews}</td>
                <td className="py-2.5">{r.symbolTaps}</td>
                <td className="py-2.5">{r.uniqueUsers}</td>
              </tr>
            ))}
            {geo.spainRegions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[#042D22]/50">
                  —
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <IntranetCard title="Pulsaciones símbolo" value={data.totals.symbolTaps} />
        <IntranetCard title="Enunciados" value={data.totals.utterances} />
        <IntranetCard title="Acciones navegación" value={data.totals.navigationActions} />
        <IntranetCard
          title="Usuarios con actividad"
          value={data.totals.activeUsers30d}
          hint="30 días"
        />
      </div>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#042D22]">Usuarios activos (DAU / WAU / MAU)</h2>
        <div className="mt-4">
          <MiniBarChart
            dates={dates}
            series={[
              { label: 'DAU', values: data.dailyActive.map((d) => d.dau) },
              { label: 'WAU', values: data.dailyActive.map((d) => d.wau) },
              { label: 'MAU', values: data.dailyActive.map((d) => d.mau) },
            ]}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#042D22]">Actividad por plan</h2>
          <ul className="mt-4 space-y-3">
            {data.activityByPlan.map((p) => (
              <li key={p.plan}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{planLabel(normalizePlanKey(p.plan))}</span>
                  <span className="font-bold">{p.events}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full bg-[#3A7CEC]"
                    style={{ width: `${(p.events / maxPlan) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#042D22]">Top actividad en app</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.topEvents.map((e) => (
              <li key={e.event} className="flex justify-between">
                <span>{e.event}</span>
                <span className="font-bold">{e.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
