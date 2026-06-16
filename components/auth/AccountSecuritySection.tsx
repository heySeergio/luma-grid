'use client'

import { useCallback, useEffect, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'
import { AnimatePresence } from 'framer-motion'
import { Fingerprint, KeyRound, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import {
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
} from '@/app/actions/twoFactor'
import { deletePasskey, listPasskeys, type PasskeyListItem } from '@/app/actions/passkeys'
import SecuritySetupGuideModal, { type SecurityGuideKind } from '@/components/auth/SecuritySetupGuideModal'

type SecurityAccountInfo = {
  linkedProviders?: string[]
  passkeyCount?: number
  passkeys?: PasskeyListItem[]
  twoFactorEnabled?: boolean
  emailVerified?: boolean
}

type Props = {
  accountSettings: SecurityAccountInfo | null
  onAccountRefresh?: () => void
}

export default function AccountSecuritySection({ accountSettings, onAccountRefresh }: Props) {
  const [passkeys, setPasskeys] = useState<
    { id: string; deviceName: string | null; createdAt: string; lastUsedAt: string | null }[]
  >([])
  const [loadingPasskeys, setLoadingPasskeys] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [disablePassword, setDisablePassword] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [setupGuide, setSetupGuide] = useState<SecurityGuideKind | null>(null)

  const loadPasskeys = useCallback(async () => {
    if (!accountSettings) return
    setLoadingPasskeys(true)
    try {
      setPasskeys(await listPasskeys())
    } catch {
      setPasskeys(accountSettings.passkeys ?? [])
    } finally {
      setLoadingPasskeys(false)
    }
  }, [accountSettings])

  useEffect(() => {
    if (accountSettings?.passkeys) {
      setPasskeys(accountSettings.passkeys)
      return
    }
    if (accountSettings) {
      void loadPasskeys()
    }
  }, [accountSettings, loadPasskeys])

  const providers = accountSettings?.linkedProviders ?? []
  const canUseSecurityFeatures =
    accountSettings?.emailVerified === true || providers.includes('google')
  const providerLabel = (p: string) =>
    p === 'google' ? 'Google' : p === 'credentials' ? 'Correo y contraseña' : p

  async function handleBegin2fa() {
    setBusy(true)
    setStatus('')
    try {
      const { qrDataUrl: qr, setupToken: token } = await beginTwoFactorSetup()
      setQrDataUrl(qr)
      setSetupToken(token)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Error al iniciar 2FA')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm2fa() {
    setBusy(true)
    setStatus('')
    try {
      const { backupCodes: codes } = await confirmTwoFactorSetup(totpCode, setupToken)
      setBackupCodes(codes)
      setQrDataUrl(null)
      setTotpCode('')
      onAccountRefresh?.()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Código incorrecto')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable2fa() {
    setBusy(true)
    setStatus('')
    try {
      await disableTwoFactor({ password: disablePassword, totpCode: totpCode || undefined })
      setDisablePassword('')
      setTotpCode('')
      onAccountRefresh?.()
      setStatus('2FA desactivado')
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'No se pudo desactivar')
    } finally {
      setBusy(false)
    }
  }

  async function handleAddPasskey() {
    setBusy(true)
    setStatus('')
    try {
      const optsRes = await fetch('/api/auth/passkey/register/options', { method: 'POST' })
      const optsData = (await optsRes.json()) as {
        options?: PublicKeyCredentialCreationOptionsJSON
        challengeToken?: string
        error?: string
      }
      if (!optsRes.ok || !optsData.options || !optsData.challengeToken) {
        throw new Error(optsData.error || 'No se pudo registrar passkey')
      }
      const attestation = await startRegistration({ optionsJSON: optsData.options })
      const verifyRes = await fetch('/api/auth/passkey/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: optsData.challengeToken,
          response: attestation,
          deviceName: deviceName.trim() || undefined,
        }),
      })
      const verifyData = (await verifyRes.json()) as { error?: string }
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Registro fallido')
      setDeviceName('')
      setStatus('Passkey registrada')
      await loadPasskeys()
      onAccountRefresh?.()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Error al registrar passkey')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeletePasskey(id: string) {
    setBusy(true)
    try {
      await deletePasskey(id)
      await loadPasskeys()
      onAccountRefresh?.()
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'No se pudo eliminar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <ShieldCheck size={16} />
        Seguridad de la cuenta
      </p>

      {!canUseSecurityFeatures ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Verifica tu correo para activar 2FA y passkeys.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {providers.length ? (
          providers.map((p) => (
            <span
              key={p}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {providerLabel(p)}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">Sin métodos vinculados registrados</span>
        )}
        {(accountSettings?.passkeyCount ?? 0) > 0 ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            {accountSettings?.passkeyCount} passkey(s)
          </span>
        ) : null}
      </div>

      {accountSettings?.twoFactorEnabled ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">2FA activo</p>
          <input
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="Código TOTP o contraseña"
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Contraseña (alternativa)"
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDisable2fa()}
            className="ui-secondary-button rounded-xl px-3 py-2 text-xs font-semibold"
          >
            Desactivar 2FA
          </button>
        </div>
      ) : qrDataUrl ? (
        <div className="space-y-3">
          <img src={qrDataUrl} alt="Código QR 2FA" className="mx-auto h-40 w-40 rounded-lg" />
          <input
            type="text"
            inputMode="numeric"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="Código de 6 dígitos"
            className="app-input w-full rounded-xl px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConfirm2fa()}
            className="ui-primary-button rounded-xl px-3 py-2 text-xs font-semibold"
          >
            Confirmar 2FA
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || !canUseSecurityFeatures}
          onClick={() => setSetupGuide('2fa')}
          className="ui-secondary-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <KeyRound size={14} />}
          Activar 2FA (TOTP)
        </button>
      )}

      {backupCodes ? (
        <div className="rounded-xl bg-amber-50 p-3 text-xs dark:bg-amber-950/40">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Guarda estos códigos de respaldo:</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 font-mono">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-[var(--app-border)] pt-4">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Fingerprint size={14} />
          Passkeys
        </p>
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="Nombre del dispositivo (opcional)"
            className="app-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !canUseSecurityFeatures}
            onClick={() => setSetupGuide('passkey')}
            className="ui-secondary-button shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
          >
            Añadir passkey
          </button>
        </div>
        {loadingPasskeys ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : (
          <ul className="space-y-2">
            {passkeys.map((pk) => (
              <li
                key={pk.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900"
              >
                <span>{pk.deviceName || 'Dispositivo'}</span>
                <button
                  type="button"
                  onClick={() => void handleDeletePasskey(pk.id)}
                  className="text-rose-600 hover:text-rose-500"
                  aria-label="Eliminar passkey"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status ? (
        <p
          className={`text-xs ${status.toLowerCase().includes('error') || status.includes('No autorizado') || status.includes('Verifica') || status.includes('incorrecto') || status.includes('caducado') ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}
          role="status"
        >
          {status}
        </p>
      ) : null}

      <AnimatePresence>
        {setupGuide ? (
          <SecuritySetupGuideModal
            kind={setupGuide}
            onCancel={() => setSetupGuide(null)}
            onConfirm={() => {
              const kind = setupGuide
              setSetupGuide(null)
              if (kind === '2fa') void handleBegin2fa()
              else void handleAddPasskey()
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}
