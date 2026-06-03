'use client'

import type { CapturesData } from '@/lib/intranet/captures'
import { downloadText, toWaitlistCsv } from '@/lib/intranet/csv'
import { formatDateTime } from '@/lib/intranet/format'

type Props = {
  waitlist: CapturesData['waitlist']
}

export function WaitlistPanel({ waitlist }: Props) {
  const exportCsv = () => {
    downloadText('waitlist.csv', toWaitlistCsv(waitlist), 'text/csv')
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={exportCsv}
        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#042D22] hover:bg-[#FDF8EF]"
      >
        Exportar CSV
      </button>
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-black/[0.06] bg-[#FDF8EF]">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#042D22]/50">
                Nombre
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#042D22]/50">
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase text-[#042D22]/50">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((w) => (
              <tr key={w.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-3 py-2.5 font-medium text-[#042D22]">{w.name}</td>
                <td className="px-3 py-2.5 text-[#042D22]/80">{w.email}</td>
                <td className="px-3 py-2.5 text-[#042D22]/60">{formatDateTime(w.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-black/[0.04] px-3 py-2 text-xs text-[#042D22]/45">
          {waitlist.length} inscripciones
        </p>
      </div>
    </div>
  )
}
