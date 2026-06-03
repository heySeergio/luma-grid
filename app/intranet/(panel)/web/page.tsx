import { MiniBarChart } from '@/components/intranet/MiniBarChart'
import { IntranetCard } from '@/components/intranet/IntranetCard'
import { formatDuration, getWebAnalytics } from '@/lib/intranet/web-analytics'

export default async function IntranetWebAnalyticsPage() {
  const data = await getWebAnalytics()

  const dates = data.dailyVisits.map((d) => d.date)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Tráfico web</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">
          Visitas al sitio público — landing, legal, registro… No es uso del tablero.
        </p>
        <p className="mt-2 text-xs text-[#042D22]/50">{data.sourceNote}</p>
        {data.posthogConfigured ? (
          <p className="mt-1 text-xs font-medium text-[#3A7CEC]">PostHog conectado</p>
        ) : (
          <p className="mt-1 text-xs text-[#042D22]/45">
            PostHog no configurado (opcional: POSTHOG_API_KEY + POSTHOG_PROJECT_ID).
          </p>
        )}
      </header>

      {!data.configured ? (
        <p className="rounded-2xl border border-dashed border-black/10 bg-[#FDF8EF] px-4 py-8 text-center text-sm text-[#042D22]/55">
          Sin datos aún. Navega por la web pública (inicio, /plan, /beta…) y vuelve aquí en unos
          minutos.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <IntranetCard title="Visitas (30 días)" value={data.totals.pageViews} />
            <IntranetCard
              title="Visitantes únicos"
              value={data.totals.uniqueVisitors}
              hint="Cookie anónima / sesiones"
            />
            <IntranetCard
              title="Tiempo medio"
              value={formatDuration(data.totals.avgDurationSec)}
              hint="Por página visitada"
            />
            <IntranetCard
              title="Rebote rápido"
              value={
                data.totals.bounceRatePct != null
                  ? `${data.totals.bounceRatePct}%`
                  : '—'
              }
              hint="Menos de 10 s en página"
            />
          </div>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#042D22]">Visitas por día</h2>
            <p className="mt-1 text-xs text-[#042D22]/50">
              Azul = páginas vistas · Naranja = visitantes únicos ese día
            </p>
            <div className="mt-4">
              <MiniBarChart
                dates={dates}
                series={[
                  { label: 'Visitas', values: data.dailyVisits.map((d) => d.visits) },
                  {
                    label: 'Únicos',
                    values: data.dailyVisits.map((d) => d.uniqueVisitors),
                  },
                ]}
              />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#042D22]">Páginas más visitadas</h2>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                    <th className="py-2">Página</th>
                    <th className="py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((p) => (
                    <tr key={p.path} className="border-b border-black/[0.04]">
                      <td className="py-2.5">
                        <span className="font-medium">{p.label}</span>
                        {p.label !== p.path ? (
                          <span className="mt-0.5 block font-mono text-[10px] text-[#042D22]/40">
                            {p.path}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 text-right font-bold">{p.views}</td>
                    </tr>
                  ))}
                  {data.topPages.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#042D22]/50">
                        —
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#042D22]">De dónde vienen</h2>
              <p className="mt-1 text-xs text-[#042D22]/50">
                Google, X, enlaces directos, otras webs…
              </p>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                    <th className="py-2">Fuente</th>
                    <th className="py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topReferrers.map((r) => (
                    <tr key={r.source} className="border-b border-black/[0.04]">
                      <td className="py-2.5 font-medium">{r.source}</td>
                      <td className="py-2.5 text-right font-bold">{r.visits}</td>
                    </tr>
                  ))}
                  {data.topReferrers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#042D22]/50">
                        —
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#042D22]">Campañas UTM</h2>
              <p className="mt-1 text-xs text-[#042D22]/50">
                Enlaces con ?utm_source=… (newsletter, anuncios, redes)
              </p>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                    <th className="py-2">Source</th>
                    <th className="py-2">Medium</th>
                    <th className="py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topUtmSources.map((u) => (
                    <tr
                      key={`${u.source}-${u.medium ?? ''}`}
                      className="border-b border-black/[0.04]"
                    >
                      <td className="py-2.5 font-medium">{u.source}</td>
                      <td className="py-2.5 text-[#042D22]/60">{u.medium ?? '—'}</td>
                      <td className="py-2.5 text-right font-bold">{u.visits}</td>
                    </tr>
                  ))}
                  {data.topUtmSources.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-[#042D22]/50">
                        Sin UTM aún
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#042D22]">País (aprox.)</h2>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                    <th className="py-2">País</th>
                    <th className="py-2 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCountries.map((c) => (
                    <tr key={c.country} className="border-b border-black/[0.04]">
                      <td className="py-2.5 font-medium">{c.country}</td>
                      <td className="py-2.5 text-right font-bold">{c.visits}</td>
                    </tr>
                  ))}
                  {data.topCountries.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-[#042D22]/50">
                        —
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </section>
          </div>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#042D22]">Búsquedas en el sitio</h2>
            <p className="mt-1 text-xs text-[#042D22]/50">
              Cuando haya buscador en la web, las consultas aparecerán aquí.
            </p>
            {data.topSearches.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {data.topSearches.map((s) => (
                  <li key={s.query} className="flex justify-between rounded-xl bg-[#FDF8EF] px-3 py-2">
                    <span>{s.query}</span>
                    <span className="font-bold">{s.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#042D22]/50">Sin búsquedas registradas.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
