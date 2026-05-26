import { getStripeRevenueDetail } from '@/lib/intranet/stripe-revenue'
import { formatEuros, formatDateTime } from '@/lib/intranet/format'
import { planLabel } from '@/lib/intranet/plan-labels'
import { IntranetCard } from '@/components/intranet/IntranetCard'

export default async function IntranetRevenuePage() {
  const data = await getStripeRevenueDetail()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Ingresos</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Datos desde Stripe</p>
      </header>

      {!data.configured ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          STRIPE_SECRET_KEY no configurada.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <IntranetCard title="MRR actual" value={formatEuros(data.mrrCents)} />
            <IntranetCard title="Churn este mes" value={data.churnThisMonth} />
            <IntranetCard
              title="Suscripciones activas"
              value={data.byPlan.reduce((n, r) => n + r.count, 0)}
            />
          </div>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#042D22]">Por plan</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                  <th className="py-2">Plan</th>
                  <th className="py-2">Suscripciones</th>
                  <th className="py-2">Ingreso/mes</th>
                </tr>
              </thead>
              <tbody>
                {data.byPlan.map((row) => (
                  <tr key={row.plan} className="border-b border-black/[0.04]">
                    <td className="py-2.5 font-medium">{planLabel(row.plan)}</td>
                    <td className="py-2.5">{row.count}</td>
                    <td className="py-2.5">{formatEuros(row.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#042D22]">Últimos 10 pagos</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-bold uppercase text-[#042D22]/50">
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Importe</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Plan</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-black/[0.04]">
                    <td className="py-2.5">{formatDateTime(p.createdAt)}</td>
                    <td className="py-2.5">{formatEuros(p.amountCents)}</td>
                    <td className="py-2.5">{p.email ?? '—'}</td>
                    <td className="py-2.5">{p.plan ? planLabel(p.plan) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}
