'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { uploadOgImage } from '@/app/actions/ogImage'

export function OgImageUploadForm({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [hint, setHint] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (disabled) return
    const form = e.currentTarget
    const fd = new FormData(form)
    setStatus('uploading')
    setMessage('')
    setHint('')
    const result = await uploadOgImage(fd)
    if (result.ok) {
      setStatus('done')
      setMessage(result.url)
      setHint(result.hint ?? '')
      form.reset()
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="og-token" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Token secreto
        </label>
        <input
          id="og-token"
          name="token"
          type="password"
          autoComplete="off"
          required={!disabled}
          disabled={disabled}
          className="app-input w-full rounded-xl px-4 py-2.5 text-sm"
          placeholder="Mismo valor que OG_UPLOAD_SECRET"
        />
      </div>
      <div>
        <label htmlFor="og-file" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Imagen
        </label>
        <input
          id="og-file"
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required={!disabled}
          disabled={disabled}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white dark:text-slate-300"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || status === 'uploading'}
        className="ui-primary-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {status === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Subir imagen
      </button>

      {status === 'done' ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-100">
          <p className="font-semibold">Listo</p>
          <p className="mt-1 break-all font-mono text-xs">{message}</p>
          {hint ? <p className="mt-2 text-xs leading-relaxed opacity-90">{hint}</p> : null}
        </div>
      ) : null}
      {status === 'error' ? (
        <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-900 dark:text-rose-100">
          {message}
        </p>
      ) : null}
    </form>
  )
}
