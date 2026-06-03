'use client'

import { useMemo, useState } from 'react'
import { SPAIN_CCAA, type SpainCcaaId } from '@/lib/analytics/spain-ccaa'
import {
  SPAIN_BALEARES_PATH,
  SPAIN_CANARIAS_PATH,
  SPAIN_ENCLAVES,
  SPAIN_MAP_VIEWBOX,
  SPAIN_PENINSULA_PATH,
} from '@/lib/analytics/spain-outline'
import type { RegionGeoRow } from '@/lib/intranet/geo-analytics'

type Props = {
  regions: RegionGeoRow[]
}

export function SpainGeoMap({ regions }: Props) {
  const [hover, setHover] = useState<SpainCcaaId | null>(null)

  const byCode = useMemo(() => {
    const m = new Map<SpainCcaaId, RegionGeoRow>()
    for (const r of regions) m.set(r.regionCode, r)
    return m
  }, [regions])

  const maxScore = Math.max(
    1,
    ...regions.map((r) => r.pageViews + r.symbolTaps * 0.25),
  )

  const hovered = hover ? byCode.get(hover) : null

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="relative min-h-[320px] flex-1 rounded-2xl border border-black/[0.06] bg-[#FDF8EF] p-4">
        <svg
          viewBox={SPAIN_MAP_VIEWBOX}
          className="h-auto w-full max-h-[360px]"
          role="img"
          aria-label="Mapa de actividad en España por comunidad autónoma"
        >
          <rect x="0" y="0" width="100" height="95" fill="#F5F0E8" rx="4" />

          <g aria-hidden>
            <path
              d={SPAIN_PENINSULA_PATH}
              fill="#E6DDD0"
              stroke="#042D22"
              strokeOpacity={0.22}
              strokeWidth={0.6}
              strokeLinejoin="round"
            />
            <path
              d={SPAIN_BALEARES_PATH}
              fill="#E6DDD0"
              stroke="#042D22"
              strokeOpacity={0.22}
              strokeWidth={0.45}
            />
            <path
              d={SPAIN_CANARIAS_PATH}
              fill="#E6DDD0"
              stroke="#042D22"
              strokeOpacity={0.22}
              strokeWidth={0.45}
            />
            {SPAIN_ENCLAVES.map((e, i) => (
              <circle
                key={i}
                cx={e.cx}
                cy={e.cy}
                r={e.r}
                fill="#E6DDD0"
                stroke="#042D22"
                strokeOpacity={0.22}
                strokeWidth={0.4}
              />
            ))}
          </g>

          {(Object.keys(SPAIN_CCAA) as SpainCcaaId[]).map((id) => {
            const pos = SPAIN_CCAA[id]
            const row = byCode.get(id)
            const score = row ? row.pageViews + row.symbolTaps * 0.25 : 0
            const r = score > 0 ? 3 + (score / maxScore) * 11 : 2.5
            const opacity = score > 0 ? 0.35 + (score / maxScore) * 0.65 : 0.12
            const isHover = hover === id
            return (
              <g
                key={id}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHover ? r + 2 : r}
                  fill={score > 0 ? '#3A7CEC' : '#042D22'}
                  fillOpacity={opacity}
                  stroke={isHover ? '#042D22' : '#fff'}
                  strokeWidth={isHover ? 1.2 : 0.6}
                />
                {isHover || score > maxScore * 0.4 ? (
                  <text
                    x={pos.x}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="3.2"
                    fontWeight="700"
                    fill="#fff"
                    style={{ pointerEvents: 'none' }}
                  >
                    {score > 0 ? Math.round(score) : ''}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
        <p className="mt-2 text-center text-[10px] text-[#042D22]/45">
          Mapa esquemático de España · tamaño del círculo ≈ visitas + pulsaciones (ponderadas)
        </p>
      </div>

      <div className="w-full shrink-0 rounded-2xl border border-black/[0.06] bg-white p-4 lg:w-64">
        {hovered ? (
          <>
            <p className="text-sm font-bold text-[#042D22]">{hovered?.regionName}</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#042D22]/60">Visitas (entrada)</dt>
                <dd className="font-bold">{hovered.pageViews}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#042D22]/60">Pulsaciones</dt>
                <dd className="font-bold">{hovered.symbolTaps}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#042D22]/60">Enunciados</dt>
                <dd className="font-bold">{hovered.utterances}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#042D22]/60">Usuarios</dt>
                <dd className="font-bold">{hovered.uniqueUsers}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-[#042D22]/55">
            Pasa el cursor sobre un punto para ver visitas a la app y pulsaciones en el tablero
            desde esa comunidad.
          </p>
        )}
      </div>
    </div>
  )
}
