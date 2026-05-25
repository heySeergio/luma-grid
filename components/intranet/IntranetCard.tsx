import type { ReactNode } from 'react'

type Props = {
  title: string
  value: ReactNode
  hint?: string
}

export function IntranetCard({ title, value, hint }: Props) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-[#042D22]/50">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#042D22]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#042D22]/45">{hint}</p> : null}
    </div>
  )
}
