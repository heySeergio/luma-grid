'use client'

import { useMemo, useState } from 'react'
import type { IntranetUserRow } from '@/lib/intranet/users'
import { planLabel, type PlanKey } from '@/lib/intranet/plan-labels'
import { formatDateTime } from '@/lib/intranet/format'

type SortKey = 'name' | 'email' | 'plan' | 'createdAt' | 'lastSeen'

type Props = {
  users: IntranetUserRow[]
}

export function UsersTable({ users }: Props) {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<PlanKey | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = users
    if (planFilter !== 'all') {
      rows = rows.filter((u) => u.plan === planFilter)
    }
    if (q) {
      rows = rows.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name?.toLowerCase().includes(q) ?? false),
      )
    }
    rows = [...rows].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      switch (sortKey) {
        case 'name':
          av = a.name ?? ''
          bv = b.name ?? ''
          break
        case 'email':
          av = a.email
          bv = b.email
          break
        case 'plan':
          av = a.plan
          bv = b.plan
          break
        case 'lastSeen':
          av = a.lastSeen ?? ''
          bv = b.lastSeen ?? ''
          break
        default:
          av = a.createdAt
          bv = b.createdAt
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [users, search, planFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const th = (key: SortKey, label: string) => (
    <th className="px-3 py-2 text-left">
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="text-xs font-bold uppercase tracking-wide text-[#042D22]/50 hover:text-[#042D22]"
      >
        {label}
        {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Buscar nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border border-black/10 px-4 py-2 text-sm"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as PlanKey | 'all')}
          className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium"
        >
          <option value="all">Todos los planes</option>
          <option value="libre">Libre</option>
          <option value="voz">Voz</option>
          <option value="identidad">Identidad</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-black/[0.06] bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-black/[0.06] bg-[#FDF8EF]">
            <tr>
              {th('name', 'Nombre')}
              {th('email', 'Email')}
              {th('plan', 'Plan')}
              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#042D22]/50">
                Tableros
              </th>
              {th('createdAt', 'Registro')}
              {th('lastSeen', 'Última actividad')}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-3 py-2.5 font-medium text-[#042D22]">{u.name ?? '—'}</td>
                <td className="px-3 py-2.5 text-[#042D22]/80">{u.email}</td>
                <td className="px-3 py-2.5">
                  <span className="rounded-full bg-[#3A7CEC]/10 px-2 py-0.5 text-xs font-bold text-[#2F69BA]">
                    {planLabel(u.plan)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-[#042D22]/70">{u.profileCount}</td>
                <td className="px-3 py-2.5 text-[#042D22]/60">{formatDateTime(u.createdAt)}</td>
                <td className="px-3 py-2.5 text-[#042D22]/60">{formatDateTime(u.lastSeen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-black/[0.04] px-3 py-2 text-xs text-[#042D22]/45">
          {filtered.length} de {users.length} usuarios
        </p>
      </div>
    </div>
  )
}
