'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { clearActingContext } from '@/app/actions/actingContext'
import { useRouter } from 'next/navigation'

type Props = {
  effectiveUserName: string | null
  isImpersonating: boolean
  showOrgLink?: boolean
}

export default function ActingUserBar({
  effectiveUserName,
  isImpersonating,
  showOrgLink = false,
}: Props) {
  const router = useRouter()

  if (!isImpersonating && !showOrgLink) return null

  async function switchUser() {
    await clearActingContext()
    router.push('/elegir-usuario')
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/60 bg-indigo-50/80 px-3 py-2 text-xs dark:border-indigo-500/30 dark:bg-indigo-950/40">
      {isImpersonating ? (
        <p className="font-medium text-indigo-900 dark:text-indigo-100">
          Usuario activo: <span className="font-bold">{effectiveUserName || 'Sin nombre'}</span>
        </p>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">
        {showOrgLink ? (
          <Link
            href="/admin/organizacion"
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1 font-semibold text-indigo-800 hover:bg-white/60 dark:border-indigo-500/40 dark:text-indigo-100"
          >
            Organización
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void switchUser()}
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 font-semibold text-white hover:bg-indigo-500"
        >
          <Users className="h-3.5 w-3.5" aria-hidden />
          Cambiar usuario
        </button>
      </div>
    </div>
  )
}
