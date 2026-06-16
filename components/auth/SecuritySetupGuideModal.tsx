'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Fingerprint,
  KeyRound,
  Plus,
  QrCode,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type SecurityGuideKind = '2fa' | 'passkey'

type Props = {
  kind: SecurityGuideKind
  onConfirm: () => void
  onCancel: () => void
}

type GuideStep = {
  title: string
  description: string
  scene: ReactNode
}

const noopSubscribe = () => () => {}

function StepDots({ total, current, accent }: { total: number; current: number; accent: string }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          layout
          className={`h-2 rounded-full ${i === current ? `w-6 ${accent}` : 'w-2 bg-slate-300/80 dark:bg-slate-600'}`}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      ))}
    </div>
  )
}

function SceneShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative mx-auto flex h-[min(42vw,13rem)] w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-4 shadow-inner dark:border-slate-700/60 dark:from-slate-900/80 dark:to-slate-950/90 ${className}`}
    >
      {children}
    </div>
  )
}

function TwoFactorDownloadScene() {
  const apps = ['GA', 'MS', 'Au']
  return (
    <SceneShell className="from-emerald-50/90 to-white dark:from-emerald-950/50 dark:to-slate-950/90">
      <div className="relative flex items-end gap-3">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative h-36 w-20 rounded-[1.1rem] border-[3px] border-slate-800 bg-slate-900 p-1.5 shadow-xl dark:border-slate-600"
        >
          <div className="h-full w-full rounded-[0.7rem] bg-gradient-to-b from-slate-800 to-slate-950" />
          <motion.div
            className="absolute left-1/2 top-8 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-xl bg-emerald-500/90 text-[10px] font-bold text-white"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Download className="h-4 w-4" />
          </motion.div>
        </motion.div>
        <div className="flex flex-col gap-2 pb-2">
          {apps.map((label, i) => (
            <motion.div
              key={label}
              initial={{ x: 16, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 320, damping: 26 }}
              className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-900 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/80 dark:text-emerald-100"
            >
              <Smartphone className="h-3.5 w-3.5 shrink-0" />
              {label === 'GA' ? 'Google Auth.' : label === 'MS' ? 'Microsoft' : 'Authy'}
            </motion.div>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}

function TwoFactorOpenAppScene() {
  return (
    <SceneShell className="from-emerald-50/90 to-white dark:from-emerald-950/50 dark:to-slate-950/90">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative h-40 w-[5.5rem] rounded-[1.2rem] border-[3px] border-slate-800 bg-slate-900 p-2 shadow-xl dark:border-slate-600"
      >
        <div className="mb-2 text-center text-[9px] font-semibold text-slate-400">Autenticador</div>
        <div className="space-y-1.5 px-0.5">
          {[1, 2].map((row) => (
            <div key={row} className="h-2 rounded-full bg-slate-700/80" />
          ))}
        </div>
        <motion.button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-bold text-white shadow-lg"
          animate={{ scale: [1, 1.06, 1], boxShadow: ['0 4px 14px rgba(16,185,129,0.35)', '0 6px 22px rgba(16,185,129,0.55)', '0 4px 14px rgba(16,185,129,0.35)'] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <Plus className="h-3 w-3" />
          Añadir
        </motion.button>
      </motion.div>
    </SceneShell>
  )
}

function TwoFactorScanScene() {
  return (
    <SceneShell className="from-emerald-50/90 to-white dark:from-emerald-950/50 dark:to-slate-950/90">
      <div className="flex items-center gap-4">
        <motion.div
          className="relative grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-emerald-400/70 bg-white dark:bg-slate-900"
          animate={{ borderColor: ['rgba(52,211,153,0.45)', 'rgba(52,211,153,0.95)', 'rgba(52,211,153,0.45)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <QrCode className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          <motion.div
            className="pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            animate={{ top: ['12%', '82%', '12%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <motion.div
          animate={{ x: [0, 4, 0], rotate: [-8, -4, -8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-28 w-14 rounded-[1rem] border-[3px] border-slate-800 bg-slate-900 dark:border-slate-600"
        />
      </div>
    </SceneShell>
  )
}

function TwoFactorConfirmScene() {
  const digits = ['4', '8', '2', '9', '1', '7']
  return (
    <SceneShell className="from-emerald-50/90 to-white dark:from-emerald-950/50 dark:to-slate-950/90">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5">
          {digits.map((d, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, type: 'spring', stiffness: 400, damping: 28 }}
              className="grid h-9 w-7 place-items-center rounded-lg border border-emerald-300/80 bg-white font-mono text-sm font-bold text-emerald-800 shadow-sm dark:border-emerald-500/40 dark:bg-slate-900 dark:text-emerald-200"
            >
              {d}
            </motion.span>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Guarda los códigos de respaldo
        </motion.p>
      </div>
    </SceneShell>
  )
}

function PasskeyIntroScene() {
  return (
    <SceneShell className="from-blue-50/90 to-white dark:from-blue-950/50 dark:to-slate-950/90">
      <motion.div
        className="relative grid h-20 w-20 place-items-center rounded-full bg-blue-100 dark:bg-blue-900/50"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Fingerprint className="h-10 w-10 text-blue-700 dark:text-blue-200" />
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="absolute inset-0 rounded-full border-2 border-blue-400/50"
            initial={{ scale: 0.85, opacity: 0.7 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: ring * 0.55, ease: 'easeOut' }}
          />
        ))}
      </motion.div>
    </SceneShell>
  )
}

function PasskeyNameScene() {
  return (
    <SceneShell className="from-blue-50/90 to-white dark:from-blue-950/50 dark:to-slate-950/90">
      <div className="w-full max-w-[14rem] space-y-2">
        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Nombre del dispositivo</p>
          <motion.p
            className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100"
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            Mi portátil
          </motion.p>
        </div>
        <p className="text-center text-[10px] text-slate-500 dark:text-slate-400">Opcional, pero útil si tienes varios</p>
      </div>
    </SceneShell>
  )
}

function PasskeyBrowserScene() {
  return (
    <SceneShell className="from-blue-50/90 to-white dark:from-blue-950/50 dark:to-slate-950/90">
      <div className="w-full max-w-[15rem] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5 dark:border-slate-800">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="flex flex-col items-center gap-2 px-3 py-4">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 dark:bg-blue-900/60"
          >
            <ScanFace className="h-5 w-5 text-blue-700 dark:text-blue-200" />
          </motion.div>
          <p className="text-center text-[10px] font-semibold text-slate-700 dark:text-slate-200">Confirma con tu dispositivo</p>
          <div className="flex flex-wrap justify-center gap-1">
            {['Huella', 'Face ID', 'PIN'].map((label) => (
              <span key={label} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  )
}

function PasskeyReadyScene() {
  return (
    <SceneShell className="from-blue-50/90 to-white dark:from-blue-950/50 dark:to-slate-950/90">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        className="relative"
      >
        <motion.div
          className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-300" strokeWidth={2.5} />
        </motion.div>
        <motion.span
          className="absolute -right-1 -top-1 text-amber-500"
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.span>
      </motion.div>
    </SceneShell>
  )
}

const GUIDE_STEPS: Record<SecurityGuideKind, { steps: GuideStep[]; confirmLabel: string; accentBar: string; iconBg: string; Icon: typeof KeyRound }> = {
  '2fa': {
    Icon: KeyRound,
    accentBar: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
    confirmLabel: 'Mostrar código QR',
    steps: [
      {
        title: 'Descarga una app autenticadora',
        description: 'Instala Google Authenticator, Microsoft Authenticator o Authy en tu móvil.',
        scene: <TwoFactorDownloadScene />,
      },
      {
        title: 'Añade tu cuenta',
        description: 'Abre la app y pulsa «Añadir cuenta» o el botón +.',
        scene: <TwoFactorOpenAppScene />,
      },
      {
        title: 'Escanea el código QR',
        description: 'En el siguiente paso verás un QR. Apunta con la cámara del móvil.',
        scene: <TwoFactorScanScene />,
      },
      {
        title: 'Introduce el código de 6 dígitos',
        description: 'Copia el número que aparece en la app y guárdalo junto con los códigos de respaldo.',
        scene: <TwoFactorConfirmScene />,
      },
    ],
  },
  passkey: {
    Icon: Fingerprint,
    accentBar: 'bg-blue-500',
    iconBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    confirmLabel: 'Crear passkey',
    steps: [
      {
        title: 'Tu llave digital',
        description: 'Las passkeys permiten entrar sin contraseña, usando biometría o el PIN del dispositivo.',
        scene: <PasskeyIntroScene />,
      },
      {
        title: 'Nombra el dispositivo',
        description: 'Opcional: pon un nombre para reconocerlo después (p. ej. «Mi portátil»).',
        scene: <PasskeyNameScene />,
      },
      {
        title: 'Confirma en el navegador',
        description: 'Al continuar, tu sistema pedirá huella, Face ID, Windows Hello o PIN.',
        scene: <PasskeyBrowserScene />,
      },
      {
        title: '¡Listo para registrar!',
        description: 'Pulsa el botón de abajo y acepta el aviso de tu navegador.',
        scene: <PasskeyReadyScene />,
      },
    ],
  },
}

export default function SecuritySetupGuideModal({ kind, onConfirm, onCancel }: Props) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const reduceMotion = useReducedMotion()
  const config = GUIDE_STEPS[kind]
  const { Icon } = config
  const [step, setStep] = useState(0)

  const total = config.steps.length
  const isFirst = step === 0
  const isLast = step === total - 1
  const current = config.steps[step]!

  useEffect(() => {
    setStep(0)
  }, [kind])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'ArrowRight' && !isLast) setStep((s) => Math.min(s + 1, total - 1))
      if (e.key === 'ArrowLeft' && !isFirst) setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, isFirst, isLast, total])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  if (!isClient) return null

  const slideVariants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
      }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'var(--app-modal-backdrop)' }}
        onClick={onCancel}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="ui-modal-panel relative flex w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] shadow-2xl"
        style={{ maxHeight: 'min(90dvh, 34rem)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-setup-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <motion.div
            className={`h-full ${config.accentBar}`}
            initial={false}
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100/80 px-4 py-3 sm:px-5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${config.iconBg}`}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Paso {step + 1} de {total}
              </p>
              <h3 id="security-setup-guide-title" className="truncate text-base font-bold text-slate-800 dark:text-slate-100">
                {kind === '2fa' ? 'Activar 2FA' : 'Registrar passkey'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={`${kind}-${step}`} {...slideVariants} transition={{ duration: 0.28 }}>
                <div className="mb-4">{current.scene}</div>
                <h4 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">{current.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{current.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="shrink-0 space-y-3 border-t border-slate-100/80 px-4 py-4 sm:px-5 dark:border-slate-800">
            <StepDots total={total} current={step} accent={config.accentBar} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={onCancel}
                className="ui-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold sm:order-1"
              >
                Cancelar
              </button>

              <div className="flex gap-2 sm:order-2">
                {!isFirst ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="ui-secondary-button inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold sm:flex-none"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Atrás
                  </button>
                ) : null}

                {isLast ? (
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="ui-primary-button inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-5 py-2 text-sm font-semibold sm:flex-none"
                  >
                    {config.confirmLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="ui-primary-button inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-5 py-2 text-sm font-semibold sm:flex-none"
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
