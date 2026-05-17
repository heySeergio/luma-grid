'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Bug,
  FlaskConical,
  Heart,
  MessageCircle,
  Sparkles,
  UserPlus,
  Wrench,
} from 'lucide-react'

import { SparklesText } from '@/components/ui/sparkles-text'
import { BRAND_NAV_HOVER_COLORS } from '@/lib/site/brandNavHoverColors'

const WHATSAPP_URL = 'https://wa.me/34613910337'
const WHATSAPP_LABEL = '+34 613 910 337'
const DOCS_URL = 'https://docs.lumagrid.app'

const stampEase = [0.22, 1.08, 0.36, 1] as const

const easeOut = [0.22, 1, 0.36, 1] as const

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.11, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: easeOut },
  },
}

const cards = [
  {
    icon: Bug,
    title: 'Encuentra fallos',
    body: 'Si algo no responde, se ve raro o deja de funcionar, cuéntanoslo. Cada aviso nos ayuda a corregir antes del lanzamiento.',
    accent: 'bg-[#FFB3C8] text-[#042D22]',
  },
  {
    icon: Wrench,
    title: 'Propón mejoras',
    body: '¿Echas en falta un gesto, un flujo más claro o un detalle en el tablero? Tu mirada de uso real vale más que cualquier checklist interno.',
    accent: 'bg-[#FFDB3D] text-[#042D22]',
  },
  {
    icon: Sparkles,
    title: 'Prueba con calma',
    body: 'Usa Luma Grid como lo harías en el día a día: frases, pictogramas, voz, perfiles… Cuanto más natural sea la prueba, más útil será tu feedback.',
    accent: 'bg-[#35AA63] text-white',
  },
] as const

function BetaDocsStamp({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.span
      className="pointer-events-none absolute -right-2 top-2 z-10 inline-flex select-none sm:-right-1 sm:top-3"
      aria-hidden
      initial={reduceMotion ? false : { opacity: 0, scale: 1.42, rotate: -14 }}
      animate={{ opacity: 1, scale: 1, rotate: 11 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              opacity: { delay: 0.48, duration: 0.18, ease: easeOut },
              scale: { delay: 0.5, duration: 0.32, ease: stampEase },
              rotate: { delay: 0.54, duration: 0.36, ease: easeOut },
            }
      }
    >
      <span className="inline-block rounded-md border-[3px] border-dashed border-[#FE6B45] bg-[#FFF9F2] px-3 py-1.5 text-[11px] font-black uppercase leading-none tracking-[0.2em] text-[#FE6B45] shadow-[0_4px_18px_rgba(254,107,69,0.25)]">
        Guía
      </span>
    </motion.span>
  )
}

const adminHintStagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
}

const adminHintLine = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: easeOut },
  },
}

const adminHintCard = {
  hidden: { opacity: 0, y: 28, scale: 0.92, rotate: -3 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.58, ease: stampEase },
  },
}

function BetaAdminFeedbackHint({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      className="mt-6 border-t border-[#FE6B45]/20 pt-6"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-48px' }}
      variants={adminHintStagger}
    >
      <motion.p
        variants={adminHintLine}
        className="text-sm font-medium leading-relaxed text-[#042D22]/78 sm:text-base"
      >
        Si buscas dar un feedback más directo que yendo por WhatsApp u otro canal, dentro del{' '}
        <Link
          href="/admin"
          className="font-extrabold text-[#F16641] underline decoration-[#F16641]/35 underline-offset-[3px] transition hover:decoration-[#F16641]"
        >
          panel de administración
        </Link>{' '}
        encontrarás esto:
      </motion.p>

      <motion.div variants={adminHintCard} className="mx-auto mt-4 w-full max-w-md">
        <div
          className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/90 p-4 shadow-[0_12px_32px_-18px_rgba(120,53,15,0.35)]"
          aria-hidden
        >
          {!reduceMotion ? (
            <motion.span
              className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-transparent via-amber-200/40 to-transparent opacity-60"
              aria-hidden
              animate={{ x: ['-120%', '120%'] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
            />
          ) : null}
          <div className="relative flex items-start gap-3">
            <motion.span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-200/90 text-amber-950"
              aria-hidden
              animate={
                reduceMotion
                  ? undefined
                  : { rotate: [0, -6, 6, -4, 0], scale: [1, 1.06, 1] }
              }
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            >
              <FlaskConical className="size-[1.15rem]" strokeWidth={2.25} />
            </motion.span>
            <motion.div
              className="min-w-0 flex-1"
              animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/90">
                Versión experimental
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-amber-950/90">
                Luma Grid está en fase beta: puede haber errores o cambios. Siempre puedes enviarnos
                sugerencias o avisarnos si algo falla.
              </p>
              <span className="mt-4 flex w-full items-center justify-center rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-amber-50 shadow-sm">
                Enviar sugerencia
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function FloatingOrb({
  className,
  delay = 0,
  reduceMotion,
}: {
  className: string
  delay?: number
  reduceMotion: boolean
}) {
  if (reduceMotion) {
    return <motion.div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} aria-hidden />
  }

  return (
    <motion.div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      aria-hidden
      animate={{ y: [0, -14, 0], x: [0, 8, 0], scale: [1, 1.06, 1] }}
      transition={{
        duration: 9,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

export default function BetaPageContent() {
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <main className="relative overflow-hidden bg-canvas px-4 pb-16 pt-32 sm:px-6 sm:pt-28 md:pb-20 lg:px-8">
      <FloatingOrb
        className="left-[8%] top-24 h-48 w-48 bg-[#FE6B45]/25 sm:h-64 sm:w-64"
        reduceMotion={reduceMotion}
      />
      <FloatingOrb
        className="right-[5%] top-40 h-56 w-56 bg-[#3A7CEC]/20 sm:h-72 sm:w-72"
        delay={1.2}
        reduceMotion={reduceMotion}
      />
      <FloatingOrb
        className="bottom-32 left-[30%] h-40 w-40 bg-[#35AA63]/15"
        delay={2.4}
        reduceMotion={reduceMotion}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-3xl"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FE6B45]/30 bg-[#FE6B45]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#FE6B45]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FE6B45] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#FE6B45]" />
            </span>
            Beta cerrada
          </span>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6">
          <SparklesText
            className="text-balance text-4xl leading-[1.08] tracking-tight sm:text-5xl"
            palette={BRAND_NAV_HOVER_COLORS}
            sparklesCount={14}
          >
            <span className="text-[#042D22]">Gracias por probar </span>
            <span className="text-[#FE6B45]">Luma Grid</span>
            <span className="text-[#042D22]"> antes que nadie</span>
          </SparklesText>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-5 text-pretty text-lg font-medium leading-relaxed text-[#042D22]/80 sm:text-xl"
        >
          Estás en una beta cerrada: un grupo reducido de personas que nos ayuda a pulir el
          comunicador antes de abrirlo al público. El objetivo es sencillo — detectar fallos y
          descubrir mejoras que solo se ven usando el producto de verdad.
        </motion.p>

        <motion.section
          variants={fadeUp}
          className="relative mt-8 overflow-visible rounded-2xl border border-black/8 bg-white/85 p-6 shadow-[0_10px_40px_rgba(4,45,34,0.07)] backdrop-blur-sm sm:p-7"
        >
          <BetaDocsStamp reduceMotion={reduceMotion} />
          <div className="flex items-start gap-4">
            <motion.span
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#3A7CEC]/15 text-[#2F69BA]"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: 0.42, duration: 0.35, ease: stampEase }
              }
              aria-hidden
            >
              <BookOpen className="size-6" strokeWidth={2} />
            </motion.span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-[#042D22] sm:text-xl">
                Contexto completo del producto
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-[#042D22]/78 sm:text-base">
                En la documentación encontrarás cómo funciona el tablero, los perfiles, la voz, el
                panel de administración y mucho más. Te recomendamos echarle un vistazo antes o
                durante la prueba.
              </p>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#FE6B45] underline-offset-4 transition hover:text-[#042D22] hover:underline"
              >
                Abrir docs.lumagrid.app
                <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        </motion.section>

        <motion.ul
          variants={fadeUp}
          className="mt-8 grid gap-4 sm:grid-cols-3"
          role="list"
        >
          {cards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.li
                key={card.title}
                className="rounded-2xl border border-black/6 bg-white/80 p-5 shadow-[0_8px_32px_rgba(4,45,34,0.06)] backdrop-blur-sm"
                initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.45,
                  ease: easeOut,
                  delay: reduceMotion ? 0 : 0.35 + index * 0.1,
                }}
                whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
              >
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-xl shadow-sm ${card.accent}`}
                  aria-hidden
                >
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <h2 className="mt-4 text-base font-extrabold text-[#042D22]">{card.title}</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-[#042D22]/75">
                  {card.body}
                </p>
              </motion.li>
            )
          })}
        </motion.ul>

        <motion.section
          variants={fadeUp}
          className="mt-10 rounded-2xl border border-black/8 bg-[#042D22] p-6 text-white shadow-lg sm:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <MessageCircle className="size-5 text-[#35AA63]" strokeWidth={2} aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">¿Cómo contactar?</h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/85 sm:text-base">
                Puedes escribirnos por el mismo canal por el que te invitamos a la beta (correo,
                mensaje directo, etc.) o por WhatsApp cuando te venga mejor.
              </p>
            </div>
          </div>

          <motion.div
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.55, duration: 0.4 }}
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MessageCircle className="size-5" aria-hidden />
              WhatsApp {WHATSAPP_LABEL}
            </a>
            <p className="self-center text-sm font-medium text-white/70">
              O responde por el medio por el que te contactamos
            </p>
          </motion.div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="mt-8 mb-10 rounded-2xl border border-dashed border-[#FE6B45]/35 bg-[#FFF9F2] px-6 py-7 sm:mb-12 sm:px-8"
        >
          <h2 className="text-lg font-extrabold text-[#042D22]">Tu feedback importa</h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-[#042D22]/78 sm:text-base">
            No hace falta un informe largo: un mensaje con lo que pasaba, en qué pantalla estabas y
            qué esperabas que ocurriera ya nos sirve. Capturas o vídeos cortos son bienvenidos si te
            facilitan explicarlo.
          </p>
          <BetaAdminFeedbackHint reduceMotion={reduceMotion} />
        </motion.section>

        <motion.div variants={fadeUp}>
          <p className="flex items-start gap-2 text-pretty text-base font-semibold leading-snug text-[#042D22] sm:text-lg">
            <Heart className="mt-0.5 size-5 shrink-0 text-[#FE6B45]" aria-hidden />
            <span>
              Agradezco de corazón el apoyo: con tu ayuda lograremos que más gente se comunique con
              libertad. Gracias por prestarnos tu tiempo y tu confianza.
            </span>
          </p>

          <p className="mt-8 text-sm font-medium leading-relaxed text-[#042D22]/78 sm:text-base">
            Cuando ya tengas cuenta, no hace falta volver a esta página: con entrar en{' '}
            <Link href="/tablero" className="font-bold text-[#042D22] underline-offset-2 hover:underline">
              lumagrid.app/tablero
            </Link>{' '}
            para usar el comunicador, o en{' '}
            <Link href="/admin" className="font-bold text-[#042D22] underline-offset-2 hover:underline">
              /admin
            </Link>{' '}
            para configurar tableros y perfiles, te basta.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-[#FE6B45] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              <UserPlus className="size-5" aria-hidden />
              Crear cuenta
            </Link>
            <Link
              href="/tablero"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[#042D22] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
            >
              Ir al tablero
            </Link>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-black/12 bg-white px-6 py-3.5 text-sm font-bold text-[#042D22] shadow-sm transition hover:bg-[#FFF9F2]"
            >
              <BookOpen className="size-5 text-[#2F69BA]" aria-hidden />
              Documentación
            </a>
          </div>
        </motion.div>

        <motion.p variants={fadeUp} className="mt-8 text-center text-xs font-medium text-[#042D22]/50">
          Luma Grid · beta cerrada · uso bajo invitación
        </motion.p>
      </motion.div>
    </main>
  )
}
