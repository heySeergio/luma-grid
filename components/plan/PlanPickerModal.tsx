'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { X } from 'lucide-react'
import PricingCards from '@/components/plan/PricingCards'
import { completeFreePlanSelection, startSubscriptionCheckout } from '@/app/actions/plan'

type Props = {
  open: boolean
  dismissable?: boolean
  onClose?: () => void
  /** Tras elegir plan gratis o al cerrar tras éxito */
  onCompleted?: () => void
}

export default function PlanPickerModal({ open, dismissable = false, onClose, onCompleted }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleFree() {
    setError(null)
    setBusy(true)
    try {
      await completeFreePlanSelection()
      onCompleted?.()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo activar el plan.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePaid(tier: 'voice' | 'identity', interval: 'month' | 'year') {
    setError(null)
    setBusy(true)
    try {
      const r = await startSubscriptionCheckout(tier, interval)
      window.location.href = r.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-md">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white md:text-3xl">Elige tu plan</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Puedes empezar gratis sin tarjeta. Los planes de pago incluyen voces naturales ElevenLabs y más tableros.
              </p>
            </div>
            {dismissable && onClose ? (
              <button
                type="button"
                onClick={() => !busy && onClose()}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-100">{error}</p>
          ) : null}

          <div className="rounded-3xl border border-white/10 bg-white/95 p-6 shadow-2xl dark:bg-slate-900/95">
            <PricingCards
              variant="modal"
              disabled={busy}
              onSelectFree={handleFree}
              onSelectPaid={handlePaid}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
