"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

import { useDelayedSectionReveal } from "@/components/landing/useDelayedSectionReveal";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

const easeOut = [0.22, 1, 0.36, 1] as const;

const TITLE_DURATION = 0.44;
const GAP_AFTER_HEADLINE = 0.12;
const HEADLINE_END_TIME = TITLE_DURATION + GAP_AFTER_HEADLINE;
const FIRST_CARD_DELAY = HEADLINE_END_TIME;
const CARD_STAGGER = 0.125;
const CARD_DURATION = 0.46;
const BRAND_ORANGE = "#FE6B45";

type BillingInterval = "month" | "year";

const PLANS = [
  {
    id: "free",
    name: "Plan Libre",
    tagline: "Para empezar sin tarjeta.",
    monthly: 0,
    yearly: 0,
    savings: null as number | null,
    features: [
      "3 tableros activos",
      "Hasta 150 botones en total",
      "Voz del sistema (TTS)",
      "Autocompletado inteligente de frases",
    ],
    cta: "Empezar gratis",
    href: "/register",
    highlight: false,
  },
  {
    id: "voice",
    name: "Plan Voz",
    tagline: "Voces naturales y más tableros.",
    monthly: 9,
    yearly: 79,
    savings: 29,
    features: [
      "Hasta 5 tableros",
      "Botones ilimitados",
      "Voces naturales y realistas",
      "50.000 caracteres de voz / mes",
    ],
    cta: "Registrarse y activar Voz",
    href: "/register",
    highlight: true,
  },
  {
    id: "identity",
    name: "Plan Identidad",
    tagline: "Clonación de voz y máxima personalización.",
    monthly: 24,
    yearly: 199,
    savings: 89,
    features: [
      "Hasta 20 tableros",
      "Botones ilimitados",
      "Voces + clonación de voz",
      "100.000 caracteres de voz / mes",
    ],
    cta: "Registrarse y activar Identidad",
    href: "/register",
    highlight: false,
  },
] as const;

function formatPrice(plan: (typeof PLANS)[number], interval: BillingInterval) {
  if (plan.monthly === 0) return { main: "0 €", suffix: "/mes" };
  const amount = interval === "month" ? plan.monthly : plan.yearly;
  const suffix = interval === "month" ? "/mes" : "/año";
  return { main: `${amount} €`, suffix };
}

export function PricingEntrance() {
  const rootRef = useRef(null);
  const { revealed } = useDelayedSectionReveal(rootRef);
  const reduceMotion = useReducedMotion();
  const isMobileLayout = useIsMobileLayout();
  const [interval, setInterval] = useState<BillingInterval>("month");

  const cardDelay = (index: number) =>
    isMobileLayout ? 0 : FIRST_CARD_DELAY + index * CARD_STAGGER;

  const lineHidden = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 };
  const lineShown = { opacity: 1, y: 0 };
  const cardHidden = reduceMotion
    ? { opacity: 1, y: 0, scale: 1 }
    : { opacity: 0, y: 18, scale: 0.985 };
  const cardShown = { opacity: 1, y: 0, scale: 1 };

  return (
    <div ref={rootRef} className="mx-auto max-w-6xl">
      <h2 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-forest sm:text-4xl">
        <motion.span
          className="block"
          initial={lineHidden}
          animate={reduceMotion || revealed ? lineShown : lineHidden}
          transition={
            reduceMotion ? { duration: 0 } : { duration: TITLE_DURATION, ease: easeOut }
          }
        >
          Elige el plan que mejor se adapta{" "}
          <span className="text-[#35AA63] underline decoration-[#35AA63] underline-offset-[0.2em] decoration-2">
            a ti.
          </span>
        </motion.span>
      </h2>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-forest/70">Facturación:</span>
        <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              interval === "month" ? "bg-forest text-white" : "text-forest/70 hover:text-forest"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              interval === "year" ? "bg-forest text-white" : "text-forest/70 hover:text-forest"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, index) => {
          const price = formatPrice(plan, interval);
          const ctaClass = plan.highlight
            ? "mt-8 inline-flex w-full justify-center rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:brightness-95"
            : "mt-8 inline-flex w-full justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-center text-sm font-bold text-forest transition hover:bg-neutral-50";

          return (
            <motion.article
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-md ${
                plan.highlight
                  ? "border-2 shadow-[0_10px_40px_-12px_rgba(254,107,69,0.35)]"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
              style={plan.highlight ? { borderColor: BRAND_ORANGE } : undefined}
              initial={cardHidden}
              animate={reduceMotion || revealed ? cardShown : cardHidden}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: cardDelay(index), duration: CARD_DURATION, ease: easeOut }
              }
            >
              {plan.highlight ? (
                <p
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
                  style={{ backgroundColor: BRAND_ORANGE }}
                >
                  Recomendado
                </p>
              ) : null}
              <h3 className="text-xl font-extrabold text-forest">{plan.name}</h3>
              <p className="mt-2 text-sm text-forest/70">{plan.tagline}</p>
              <p className="mt-6 text-3xl font-extrabold tabular-nums tracking-tight text-forest">
                {price.main}
                <span className="text-lg font-bold text-forest/55">{price.suffix}</span>
              </p>
              {interval === 'year' && plan.savings ? (
                <p className="mt-1 text-sm font-bold text-emerald-600">Ahorras {plan.savings} €</p>
              ) : interval === 'month' && plan.yearly > 0 && plan.savings ? (
                <p className="mt-1 text-xs font-medium text-forest/55">
                  o{' '}
                  <button
                    type="button"
                    onClick={() => setInterval('year')}
                    className="underline decoration-forest/35 underline-offset-2 transition hover:text-forest hover:decoration-forest"
                  >
                    {plan.yearly} €/año
                  </button>{' '}
                  <span className="font-bold text-emerald-600">(Ahorras {plan.savings} €)</span>
                </p>
              ) : null}
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm font-medium text-forest/80">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={ctaClass}
                style={plan.highlight ? { backgroundColor: BRAND_ORANGE } : undefined}
              >
                {plan.cta}
              </Link>
            </motion.article>
          );
        })}
      </div>

      <motion.div
        className="mt-8 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-r from-sky-50 to-white p-6 sm:p-8"
        initial={cardHidden}
        animate={reduceMotion || revealed ? cardShown : cardHidden}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { delay: cardDelay(3), duration: CARD_DURATION, ease: easeOut }
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-sky-800/80">
              Plan Terapeuta
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-forest sm:text-xl">
              ¿Eres logopeda o profesional y gestionas varios alumnos?
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-forest/75">
              Hasta 10 usuarios, panel de organización y evaluación avanzada. Desde 69 €/mes.
            </p>
          </div>
          <Link
            href="/planes#plan-terapeuta"
            className="inline-flex shrink-0 justify-center rounded-full bg-sky-700 px-6 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-sky-600"
          >
            Ver Plan Terapeuta
          </Link>
        </div>
      </motion.div>

      <p className="mt-6 text-center text-sm text-forest/60">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-forest underline-offset-2 hover:underline">
          Inicia sesión
        </Link>
        {" · "}
        <Link href="/planes" className="font-semibold text-forest underline-offset-2 hover:underline">
          Comparar todos los planes
        </Link>
      </p>
    </div>
  );
}
