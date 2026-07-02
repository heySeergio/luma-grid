'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Building2, UserRound } from 'lucide-react'
import { setActingAsUser } from '@/app/actions/actingContext'
import type { ManagedUserRow } from '@/app/actions/organization'

type Props = {
  managedUsers: ManagedUserRow[]
  organizationName: string | null
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9']

function avatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i += 1) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function UserPickerPage({ managedUsers, organizationName }: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(userId: string) {
    setError(null)
    setBusyId(userId)
    const result = await setActingAsUser(userId)
    setBusyId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push('/tablero')
    router.refresh()
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-4xl flex-1">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/90">
            {organizationName?.trim() || 'Tu organización'}
          </p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">¿Quién va a usar Luma Grid?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Elige un usuario para abrir su tablero y panel de administración.
          </p>
        </div>

        {error ? (
          <p className="mb-6 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {managedUsers.map((user) => {
            const label = user.displayLabel?.trim() || user.profileName?.trim() || 'Usuario'
            const initial = label.charAt(0).toUpperCase()
            const color = avatarColor(user.userId)
            const busy = busyId === user.userId

            return (
              <button
                key={user.id}
                type="button"
                disabled={busy || busyId != null}
                onClick={() => void choose(user.userId)}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-indigo-300/40 hover:bg-white/10 disabled:opacity-60"
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-xl text-3xl font-black text-white shadow-lg transition group-hover:scale-105 md:h-24 md:w-24 md:text-4xl"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <span className="line-clamp-2 text-center text-sm font-semibold text-slate-100">{label}</span>
                {user.lastAccessedAt ? (
                  <span className="text-[10px] text-slate-400">
                    Último acceso: {new Date(user.lastAccessedAt).toLocaleDateString('es-ES')}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {managedUsers.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
            <UserRound className="mx-auto h-10 w-10 text-indigo-300" aria-hidden />
            <p className="mt-3 text-sm text-slate-300">Aún no hay usuarios gestionados.</p>
            <Link
              href="/admin/organizacion"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-400"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Gestionar organización
            </Link>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/organizacion"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <Building2 className="h-4 w-4" aria-hidden />
            Gestionar organización
          </Link>
        </div>
      </div>
    </div>
  )
}
