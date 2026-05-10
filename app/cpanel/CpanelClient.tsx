'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type FeedbackRow = {
  id: string
  anonymous: boolean
  email: string | null
  message: string
  createdAt: string
}

type WaitlistRow = {
  id: string
  name: string
  email: string
  createdAt: string
}

const cardShell =
  'rounded-[22px] border border-black/[0.06] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
const innerPanel =
  'rounded-[18px] border border-black/[0.05] bg-[#FDF8EF] shadow-[inset_0_1px_0_rgb(255_255_255/0.65)]'
const inputClass =
  'mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-medium text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-[#3A7CEC] focus:ring-4 focus:ring-[#3A7CEC]/18'

function escapeCsvCell(value: string): string {
  const s = value.replace(/\r\n/g, '\n')
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([`\ufeff${text}`], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toFeedbackCsv(rows: FeedbackRow[]): string {
  const header = ['id', 'fecha', 'anonimo', 'email', 'mensaje']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [
        r.id,
        r.createdAt,
        r.anonymous ? 'si' : 'no',
        r.email ?? '',
        r.message,
      ]
        .map((c) => escapeCsvCell(c))
        .join(','),
    ),
  ]
  return lines.join('\n')
}

function toWaitlistCsv(rows: WaitlistRow[]): string {
  const header = ['id', 'fecha', 'nombre', 'email']
  const lines = [
    header.map(escapeCsvCell).join(','),
    ...rows.map((r) =>
      [r.id, r.createdAt, r.name, r.email].map((c) => escapeCsvCell(c)).join(','),
    ),
  ]
  return lines.join('\n')
}

export function CpanelClient() {
  const [phase, setPhase] = useState<'loading' | 'auth' | 'ready'>('loading')
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const res = await fetch('/api/cpanel/data', { credentials: 'same-origin' })
    if (!res.ok) {
      setPhase('auth')
      return
    }
    const json = (await res.json()) as {
      feedback: FeedbackRow[]
      waitlist: WaitlistRow[]
    }
    setFeedback(json.feedback)
    setWaitlist(json.waitlist)
    setPhase('ready')
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetch('/api/cpanel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setLoginError(data.error ?? 'No se pudo acceder')
        setLoginLoading(false)
        return
      }
      setPassword('')
      await loadData()
    } catch {
      setLoginError('Error de conexión')
    }
    setLoginLoading(false)
  }

  const handleLogout = async () => {
    await fetch('/api/cpanel/logout', { method: 'POST', credentials: 'same-origin' })
    setFeedback([])
    setWaitlist([])
    setPhase('auth')
  }

  const removeFeedback = async (id: string) => {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/cpanel/feedback/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (res.ok) {
        setFeedback((prev) => prev.filter((f) => f.id !== id))
      }
    } finally {
      setDeleteId(null)
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

  const backLink = (
    <p className="text-sm font-semibold text-forest/70">
      <Link
        href="/"
        className="text-forest underline-offset-4 transition hover:text-coral hover:underline"
      >
        ← Volver al inicio
      </Link>
    </p>
  )

  if (phase === 'loading') {
    return (
      <div className="mx-auto max-w-4xl">
        {backLink}
        <div className="mt-10 flex min-h-[40vh] items-center justify-center font-medium text-forest/70">
          Cargando…
        </div>
      </div>
    )
  }

  if (phase === 'auth') {
    return (
      <div className="mx-auto max-w-4xl">
        {backLink}
        <header className={`mt-8 p-8 sm:p-10 ${cardShell}`}>
          <p className="inline-flex items-center gap-2.5 rounded-full bg-[#FFEB3B] px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-forest sm:text-xs sm:tracking-[0.12em]">
            <span className="size-2.5 shrink-0 rounded-full bg-[#3A7CEC]" aria-hidden />
            Acceso restringido
          </p>
          <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            Panel de <span className="text-wave">captaciones</span>
          </h1>
          <p className="mt-4 max-w-lg text-base font-medium leading-relaxed text-forest/75">
            Introduce la contraseña para ver las opiniones enviadas desde la web y los correos de la
            lista de espera.
          </p>
          <form onSubmit={handleLogin} className="mt-8 space-y-5 border-t border-black/[0.06] pt-8">
            <label className="block text-sm font-bold text-forest">
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            {loginError ? (
              <p className="text-sm font-semibold text-[#E8583E]" role="alert">
                {loginError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-full bg-black py-4 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-900 disabled:cursor-wait disabled:opacity-70"
            >
              {loginLoading ? 'Comprobando…' : 'Entrar'}
            </button>
          </form>
        </header>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {backLink}

      <header className={`mt-8 p-8 sm:p-10 ${cardShell}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2.5 rounded-full bg-[#FFEB3B] px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-forest sm:text-xs sm:tracking-[0.12em]">
              <span className="size-2.5 shrink-0 rounded-full bg-[#E53935]" aria-hidden />
              Uso interno
            </p>
            <h1 className="mt-6 text-balance text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
              Panel de <span className="text-wave">captaciones</span>
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-forest/75">
              Opiniones desde la landing y correos registrados en la waitlist.
            </p>
            <button
              type="button"
              onClick={() => {
                downloadText('feedbacks.csv', toFeedbackCsv(feedback), 'text/csv')
                setTimeout(
                  () => downloadText('waitlist.csv', toWaitlistCsv(waitlist), 'text/csv'),
                  400,
                )
              }}
              disabled={feedback.length === 0 && waitlist.length === 0}
              className="mt-6 inline-flex rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-extrabold text-forest shadow-sm transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
            >
              Descargar ambos CSV
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold text-forest shadow-sm transition hover:bg-canvas"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className={`mt-10 p-6 sm:p-8 ${cardShell}`} aria-labelledby="cpanel-feedback-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-coral">Opiniones</p>
            <h2
              id="cpanel-feedback-heading"
              className="mt-2 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl"
            >
              Feedback <span className="text-accent-blue">web</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => downloadText('feedbacks.csv', toFeedbackCsv(feedback), 'text/csv')}
            disabled={feedback.length === 0}
            className="rounded-full bg-accent-blue px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_14px_-2px_rgba(58,124,236,0.35)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Descargar todos (CSV)
          </button>
        </div>
        {feedback.length === 0 ? (
          <p className="mt-8 text-sm font-medium text-forest/60">Aún no hay opiniones guardadas.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {feedback.map((f) => (
              <li key={f.id} className={`p-5 sm:p-6 ${innerPanel}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-xs font-bold text-forest/55">
                    <time dateTime={f.createdAt}>{fmtDate(f.createdAt)}</time>
                    {f.anonymous ? (
                      <span className="ml-2 inline-flex rounded-full bg-cta-yellow px-2.5 py-0.5 text-[11px] font-extrabold text-forest">
                        Anónimo
                      </span>
                    ) : (
                      <span className="ml-2 font-semibold text-forest/80">{f.email}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadText(`feedback-${f.id}.csv`, toFeedbackCsv([f]), 'text/csv')
                      }
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-extrabold text-forest shadow-sm transition hover:bg-canvas"
                    >
                      Descargar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFeedback(f.id)}
                      disabled={deleteId === f.id}
                      className="rounded-full border border-coral/35 bg-white px-4 py-2 text-xs font-extrabold text-coral transition hover:bg-[#FFF6F9] disabled:opacity-50"
                    >
                      {deleteId === f.id ? 'Borrando…' : 'Borrar'}
                    </button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-forest/90">
                  {f.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className={`mt-8 p-6 sm:p-8 ${cardShell}`}
        aria-labelledby="cpanel-waitlist-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#2d8f52]">
              Lista de espera
            </p>
            <h2
              id="cpanel-waitlist-heading"
              className="mt-2 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl"
            >
              Waitlist <span className="text-[#FE6B45]">CTA</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => downloadText('waitlist.csv', toWaitlistCsv(waitlist), 'text/csv')}
            disabled={waitlist.length === 0}
            className="rounded-full bg-[#FE6B45] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_4px_14px_-2px_rgba(255,107,74,0.45)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Descargar CSV
          </button>
        </div>
        {waitlist.length === 0 ? (
          <p className="mt-8 text-sm font-medium text-forest/60">Aún no hay inscripciones.</p>
        ) : (
          <ul className="mt-8 divide-y divide-black/[0.06]">
            {waitlist.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-4 first:pt-0"
              >
                <div>
                  <p className="text-sm font-extrabold text-forest">{w.name}</p>
                  <p className="text-sm font-medium text-forest/70">{w.email}</p>
                </div>
                <time
                  className="text-xs font-bold text-forest/50"
                  dateTime={w.createdAt}
                >
                  {fmtDate(w.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
