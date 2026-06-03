import Link from 'next/link'
import { IntranetCard } from '@/components/intranet/IntranetCard'
import { getOverviewData } from '@/lib/intranet/overview'
import { formatEuros } from '@/lib/intranet/format'
import { planLabel, type PlanKey } from '@/lib/intranet/plan-labels'

export default async function IntranetOverviewPage() {
  const data = await getOverviewData()

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#042D22]">Overview</h1>
        <p className="mt-1 text-sm text-[#042D22]/55">Métricas principales del negocio</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <IntranetCard title="Usuarios registrados" value={data.totalUsers} />
        <IntranetCard
          title="Activos (7 días)"
          value={data.activeLast7Days}
          hint="Basado en lastSeen"
        />
        <IntranetCard title="Nuevos este mes" value={data.newUsersThisMonth} />
        <IntranetCard
          title="MRR"
          value={
            data.stripeConfigured ? formatEuros(data.mrrCents) : 'Stripe no configurado'
          }
        />
        <IntranetCard title="Tableros AAC" value={data.totalBoards} />
        <IntranetCard
          title="Planes (usuarios)"
          value={
            <span className="text-base font-semibold">
              {(Object.keys(data.planBreakdown) as PlanKey[])
                .map((k) => `${planLabel(k)}: ${data.planBreakdown[k]}`)
                .join(' · ')}
            </span>
          }
        />
      </div>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#042D22]">Feedback reciente</h2>
          <Link
            href="/intranet/feedback"
            className="text-sm font-bold text-[#3A7CEC] hover:underline"
          >
            Ver todo →
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {data.recentFeedback.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-black/[0.04] bg-[#FDF8EF] px-4 py-3"
            >
              <p className="text-xs font-bold text-[#042D22]/50">{f.label}</p>
              <p className="mt-1 text-sm text-[#042D22]/85">{f.message}</p>
            </li>
          ))}
          {data.recentFeedback.length === 0 ? (
            <li className="text-sm text-[#042D22]/50">Sin feedback aún</li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
