'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Archive, ExternalLink } from 'lucide-react'
import {
  archiveManagedUser,
  createManagedUser,
  type OrganizationSummary,
} from '@/app/actions/organization'
import { setActingAsUser } from '@/app/actions/actingContext'
import { createCustomerPortalSession } from '@/app/actions/plan'

type Props = {
  organization: OrganizationSummary
}

export default function OrganizationAdminClient({ organization }: Props) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxSlots = organization.includedUserSlots + organization.extraUserSlots
  const slotsLabel = `${organization.activeManagedCount}/${maxSlots}`

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await createManagedUser({
      displayLabel: label,
      inviteEmail: inviteEmail || null,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setLabel('')
    setInviteEmail('')
    router.refresh()
  }

  async function openUser(userId: string, target: 'tablero' | 'admin') {
    setBusy(true)
    const result = await setActingAsUser(userId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push(target === 'admin' ? '/admin' : '/tablero')
    router.refresh()
  }

  async function handleArchive(managedId: string) {
    if (!confirm('¿Archivar este usuario? Podrás liberar un cupo.')) return
    setBusy(true)
    const result = await archiveManagedUser(managedId)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function openBilling() {
    setBusy(true)
    try {
      const result = await createCustomerPortalSession()
      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }
      setError('No hay datos de facturación vinculados.')
    } catch {
      setError('No se pudo abrir el portal de facturación.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/elegir-usuario"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al selector
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Organización</h1>
          <p className="mt-1 text-sm text-slate-500">
            Usuarios gestionados: <span className="font-semibold">{slotsLabel}</span>
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void openBilling()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600"
        >
          Facturación Stripe
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="text-lg font-bold">Nuevo usuario</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Nombre en el selector</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Email de invitación (opcional)</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || organization.activeManagedCount >= maxSlots}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Crear usuario
        </button>
      </form>

      <ul className="space-y-3">
        {organization.managedUsers.map((user) => (
          <li
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {user.displayLabel || user.profileName || 'Usuario'}
              </p>
              {user.inviteEmail ? (
                <p className="text-xs text-slate-500">Invitación: {user.inviteEmail}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void openUser(user.userId, 'tablero')}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Tablero
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void openUser(user.userId, 'admin')}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Admin
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleArchive(user.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Archive className="h-3.5 w-3.5" aria-hidden />
                Archivar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
