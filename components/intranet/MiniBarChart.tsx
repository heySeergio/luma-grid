'use client'

type Series = { label: string; values: number[] }

type Props = {
  dates: string[]
  series: Series[]
}

const colors = ['#3A7CEC', '#FE6B45', '#042D22']

export function MiniBarChart({ dates, series }: Props) {
  const max = Math.max(1, ...series.flatMap((s) => s.values))

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[640px] items-end gap-1" style={{ height: 160 }}>
        {dates.map((date, i) => (
          <div key={date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[120px] w-full items-end justify-center gap-px">
              {series.map((s, si) => {
                const v = s.values[i] ?? 0
                const h = Math.max(2, Math.round((v / max) * 120))
                return (
                  <div
                    key={s.label}
                    title={`${s.label}: ${v}`}
                    className="w-2 rounded-t-sm"
                    style={{ height: h, backgroundColor: colors[si % colors.length] }}
                  />
                )
              })}
            </div>
            <span className="text-[9px] text-[#042D22]/40">
              {date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4">
        {series.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-[#042D22]/70">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}
