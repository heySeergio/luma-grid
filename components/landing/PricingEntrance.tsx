"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { useDelayedSectionReveal } from "@/components/landing/useDelayedSectionReveal";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

const easeOut = [0.22, 1, 0.36, 1] as const;

const TITLE_DURATION = 0.44;
/** Margen tras el titular antes de las tarjetas */
const GAP_AFTER_HEADLINE = 0.12;

const HEADLINE_END_TIME = TITLE_DURATION + GAP_AFTER_HEADLINE;
const FIRST_CARD_DELAY = HEADLINE_END_TIME;

/** Entre tarjetas (~0.1–0.15s) */
const CARD_STAGGER = 0.125;
const CARD_DURATION = 0.46;

/** Naranja CTA marketing (cabecera, hero, acentos) */
const BRAND_ORANGE = "#FE6B45";

export function PricingEntrance() {
  const rootRef = useRef(null);
  const { revealed } = useDelayedSectionReveal(rootRef);
  const reduceMotion = useReducedMotion();
  const isMobileLayout = useIsMobileLayout();

  const cardDelay = (index: number) =>
    isMobileLayout ? 0 : FIRST_CARD_DELAY + index * CARD_STAGGER;

  const lineHidden = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 14 };
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
            reduceMotion
              ? { duration: 0 }
              : { duration: TITLE_DURATION, ease: easeOut, delay: 0 }
          }
        >
          Elige el plan que mejor se adapta{" "}
          <span className="text-forest underline decoration-forest underline-offset-[0.2em] decoration-2">
            a ti.
          </span>
        </motion.span>
      </h2>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <motion.article
          className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          initial={cardHidden}
          animate={reduceMotion || revealed ? cardShown : cardHidden}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  delay: cardDelay(0),
                  duration: CARD_DURATION,
                  ease: easeOut,
                }
          }
        >
          <h3 className="text-xl font-extrabold text-forest">Plan Libre</h3>
          <p className="mt-2 text-sm text-forest/70">
            Para empezar a comunicarte sin límites.
          </p>
          <p className="mt-6 text-3xl font-extrabold tabular-nums tracking-tight text-forest">
            <span className="text-forest/30">—</span> €{" "}
            <span className="text-lg font-bold text-forest/55">/ mes</span>
          </p>
          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm font-medium text-forest/80">
            <li>1 tablero activo</li>
            <li>Máx. 60 botones por tablero</li>
            <li>Voz del sistema (TTS)</li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 inline-flex w-full cursor-not-allowed justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-center text-sm font-bold text-neutral-500"
          >
            Empezar gratis
          </button>
        </motion.article>

        <motion.article
          className="relative flex flex-col rounded-2xl border-2 bg-white p-8 shadow-[0_10px_40px_-12px_rgba(254,107,69,0.35)] transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-12px_rgba(254,107,69,0.45)]"
          style={{ borderColor: BRAND_ORANGE }}
          initial={cardHidden}
          animate={reduceMotion || revealed ? cardShown : cardHidden}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  delay: cardDelay(1),
                  duration: CARD_DURATION,
                  ease: easeOut,
                }
          }
        >
          <p
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            Recomendado
          </p>
          <h3 className="mt-2 text-xl font-extrabold text-forest">Plan Voz</h3>
          <p className="mt-2 text-sm text-forest/70">
            Más voces, más tableros, más posibilidades.
          </p>
          <p className="mt-6 text-3xl font-extrabold tabular-nums tracking-tight text-forest">
            <span className="text-forest/30">—</span> €{" "}
            <span className="text-lg font-bold text-forest/55">/ mes</span>
          </p>
          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm font-medium text-forest/80">
            <li>Hasta 5 tableros</li>
            <li>Botones ilimitados</li>
            <li>Voces naturales y realistas</li>
            <li>50.000 caracteres de voz / mes</li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 inline-flex w-full cursor-not-allowed justify-center rounded-full px-6 py-3 text-center text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            Elegir plan
          </button>
        </motion.article>

        <motion.article
          className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          initial={cardHidden}
          animate={reduceMotion || revealed ? cardShown : cardHidden}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  delay: cardDelay(2),
                  duration: CARD_DURATION,
                  ease: easeOut,
                }
          }
        >
          <h3 className="text-xl font-extrabold text-forest">Plan Identidad</h3>
          <p className="mt-2 text-sm text-forest/70">
            Personalización y potencia sin límites.
          </p>
          <p className="mt-6 text-3xl font-extrabold tabular-nums tracking-tight text-forest">
            <span className="text-forest/30">—</span> €{" "}
            <span className="text-lg font-bold text-forest/55">/ mes</span>
          </p>
          <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm font-medium text-forest/80">
            <li>Hasta 20 tableros</li>
            <li>Botones ilimitados</li>
            <li>Voces naturales + clonación de voz</li>
            <li>100.000 caracteres de voz / mes</li>
          </ul>
          <button
            type="button"
            disabled
            className="mt-8 inline-flex w-full cursor-not-allowed justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-center text-sm font-bold text-neutral-500"
          >
            Elegir plan
          </button>
        </motion.article>
      </div>
    </div>
  );
}
