import type { ReactNode } from 'react'

export function StatsKpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-wider text-[#042D22]/45">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#042D22]">{value}</p>
      {hint ? <p className="mt-1 text-xs font-medium text-[#042D22]/50">{hint}</p> : null}
    </div>
  )
}

export function StatsSection({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#042D22]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function MetricBars({
  items,
  empty,
}: {
  items: { x: string; y: number }[]
  empty: string
}) {
  if (items.length === 0) {
    return <p className="text-sm font-medium text-[#042D22]/50">{empty}</p>
  }
  const max = Math.max(...items.map((i) => i.y), 1)
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.x} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#042D22]">{item.x || '(directo)'}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#042D22]/8">
              <div
                className="h-full rounded-full bg-[#042D22]"
                style={{ width: `${Math.max(4, (item.y / max) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold tabular-nums text-[#042D22]/70">{item.y}</span>
        </li>
      ))}
    </ul>
  )
}

export function DaysSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (days: number) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#042D22]"
    >
      <option value={7}>7 días</option>
      <option value={30}>30 días</option>
      <option value={90}>90 días</option>
    </select>
  )
}
