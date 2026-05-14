'use client'

import { type FormEvent, useId, useState } from 'react'

type Mode = 'anonymous' | 'notify' | null

/** Misma API que el modal de feedback de lumagrid.app; CORS permitido para docs.lumagrid.app. */
const feedbackEndpoint =
  process.env.NEXT_PUBLIC_LUMA_FEEDBACK_URL ?? 'https://lumagrid.app/api/feedback'

export function DocsFeedbackForm() {
  const modeGroupId = useId()
  const messageId = useId()
  const emailId = useId()
  const [mode, setMode] = useState<Mode>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMode, setSuccessMode] = useState<Mode>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (mode === null) {
      setStatus('error')
      setErrorMessage('Elige si prefieres enviar tu mensaje de forma anónima o dejando un correo de contacto.')
      return
    }

    const anonymous = mode === 'anonymous'
    const trimmed = email.trim()
    if (!anonymous && !trimmed) {
      setStatus('error')
      setErrorMessage('Indica un correo para que podamos responderte.')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous,
          message: message.trim(),
          email: anonymous ? undefined : trimmed,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus('error')
        setErrorMessage(data.error ?? 'No se pudo enviar. Inténtalo de nuevo.')
        return
      }
      setSuccessMode(mode)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('Error de conexión. Comprueba tu red o inténtalo más tarde.')
    }
  }

  if (status === 'success') {
    return (
      <div className="docs-feedback-form docs-feedback-form--success" role="status">
        <p className="docs-feedback-success-title">¡Gracias!</p>
        <p className="docs-feedback-success-text">
          Hemos recibido tu mensaje.
          {successMode === 'notify' && email.trim() ? (
            <>
              {' '}
              Si hace falta, te contactaremos en <strong>{email.trim()}</strong>.
            </>
          ) : null}
        </p>
        <p className="docs-feedback-success-hint">
          Las entradas se guardan con el resto de feedback de la web y el equipo las revisa desde el panel interno (
          <strong>cpanel</strong>) de Luma Grid.
        </p>
      </div>
    )
  }

  return (
    <form className="docs-feedback-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="docs-feedback-fieldset">
        <legend id={modeGroupId} className="docs-feedback-legend">
          ¿Cómo quieres enviarlo?
        </legend>
        <div className="docs-feedback-mode-row">
          <label
            className={`docs-feedback-mode${mode === 'anonymous' ? ' docs-feedback-mode--on' : ''}`}
          >
            <input
              type="radio"
              name="docs-feedback-mode"
              value="anonymous"
              checked={mode === 'anonymous'}
              onChange={() => setMode('anonymous')}
            />
            <span className="docs-feedback-mode-body">
              <span className="docs-feedback-mode-title">Anónimo</span>
              <span className="docs-feedback-mode-desc">Solo el texto de tu mensaje.</span>
            </span>
          </label>
          <label className={`docs-feedback-mode${mode === 'notify' ? ' docs-feedback-mode--on' : ''}`}>
            <input
              type="radio"
              name="docs-feedback-mode"
              value="notify"
              checked={mode === 'notify'}
              onChange={() => setMode('notify')}
            />
            <span className="docs-feedback-mode-body">
              <span className="docs-feedback-mode-title">Con correo</span>
              <span className="docs-feedback-mode-desc">Para poder responderte si hace falta.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="docs-feedback-field">
        <label htmlFor={messageId} className="docs-feedback-label">
          Tu mensaje
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="docs-feedback-textarea"
          placeholder="Dudas sobre la ayuda, sugerencias, lo que no encuentres…"
          maxLength={8000}
        />
      </div>

      {mode === 'notify' ? (
        <div className="docs-feedback-field">
          <label htmlFor={emailId} className="docs-feedback-label">
            Correo electrónico
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="docs-feedback-input"
            placeholder="tu@correo.com"
          />
        </div>
      ) : null}

      {status === 'error' && errorMessage ? (
        <p className="docs-feedback-alert" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className="docs-feedback-submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}
