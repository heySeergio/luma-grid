"use client";

import Link from "next/link";
import { Sun, Volume2, Wand2, Wifi } from "lucide-react";

import { AnimatedSection } from "@/components/landing/AnimatedSection";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { AudienceStampGrid } from "@/components/landing/AudienceStampGrid";
import { CtaBannerClient } from "@/components/landing/CtaBannerClient";
import {
  FeaturesFluyeEntrance,
  type FeaturesFluyeListItem,
} from "@/components/landing/FeaturesFluyeEntrance";
import { PricingEntrance } from "@/components/landing/PricingEntrance";
import { HeroDraggableDecors } from "@/components/landing/HeroDraggableDecors";
import { HeroHeadline } from "@/components/landing/HeroHeadline";
import { useWaitlistModal } from "@/components/landing/WaitlistModalProvider";

const moverSvgOn = false;

/**
 * Arrastre de planta y niño (misma idea que `moverSvgOn` en el hero).
 * Deja `true` mientras ajustas; las posiciones persisten en localStorage (`luma-grid-features-fluye-positions`).
 * Pon `false` cuando ya esté la composición final.
 */
const featuresDecorMoverOn = false;

/**
 * Arrastre de los recursos del banner CTA (arbustos, niño, gato).
 * Deja `true` mientras ajustas; las posiciones persisten en localStorage (`luma-grid-cta-banner-positions`).
 * Pon `false` cuando ya esté la composición final.
 */
const ctaBannerMoverOn = false;

const heroFeatureIcons = {
  wifi: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none size-[22px] shrink-0 select-none"
      aria-hidden
    >
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8 3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4 2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
    </svg>
  ),
  volume: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none size-[22px] shrink-0 select-none"
      aria-hidden
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05a4.5 4.5 0 0 0 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
    </svg>
  ),
  lock: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none size-[22px] shrink-0 select-none"
      aria-hidden
    >
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
    </svg>
  ),
  shield: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="pointer-events-none size-[22px] shrink-0 select-none"
      aria-hidden
    >
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      <circle cx="12" cy="11.5" r="2.25" fill="#FDF8EE" />
    </svg>
  ),
} as const;

function Hero({
  comingSoon,
  onOpenWaitlist,
}: {
  comingSoon: boolean
  onOpenWaitlist: () => void
}) {
  return (
    <AnimatedSection
      id="inicio"
      className="relative z-0 mt-2 overflow-visible border-b border-black/5 sm:mt-3"
      enableLoop={false}
    >
      <div className="relative overflow-visible bg-canvas px-4 pb-10 pt-6 sm:px-6 sm:pb-10 sm:pt-8 md:min-h-[min(38vh,360px)] md:pb-12 md:pt-10 lg:min-h-[min(44vh,420px)] lg:px-6 lg:pb-14 lg:pt-11">
        <HeroDraggableDecors moverEnabled={moverSvgOn} />
        <div className="relative z-10 mx-auto mt-1 w-full max-w-6xl sm:mt-3 lg:mt-4">
          <HeroHeadline />
          <div className="mt-8 w-full sm:mt-16 md:mt-20 lg:mt-24">
            <p className="max-w-2xl whitespace-pre-line text-base leading-snug text-[#042D22] sm:text-lg sm:leading-snug">
              {`Luma Grid es un tablero de comunicación
aumentativa y alternativa.
Frases, pictogramas, voz e inteligencia
artificial para expresarte y conectar
con el mundo.`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-4 sm:gap-4">
              {comingSoon ? (
                <button
                  type="button"
                  onClick={onOpenWaitlist}
                  className="inline-flex rounded-full border border-black/10 bg-[#042D22] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                  aria-haspopup="dialog"
                >
                  Avísame cuando esté disponible
                </button>
              ) : (
                <Link
                  href="/tablero"
                  className="inline-flex rounded-full border border-black/10 bg-[#042D22] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
                >
                  Entrar al tablero
                </Link>
              )}
              {comingSoon ? (
                <Link
                  href="/#comunicacion-fluye"
                  className="text-sm font-bold text-forest underline-offset-4 transition hover:text-coral hover:underline"
                >
                  Ver cómo funciona →
                </Link>
              ) : (
                <Link
                  href="/admin"
                  className="text-sm font-bold text-forest underline-offset-4 transition hover:text-coral hover:underline"
                >
                  Configurar tableros →
                </Link>
              )}
            </div>
            <ul className="mt-8 grid w-full grid-cols-2 gap-x-6 gap-y-4 text-sm font-bold text-[#042D22] sm:mt-10 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-3 lg:mt-11 lg:gap-x-10">
              <li className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-[#35AA63]" aria-hidden>
                  {heroFeatureIcons.wifi}
                </span>
                <span className="min-w-0 leading-tight">Funciona offline</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-[#2F69BA]" aria-hidden>
                  {heroFeatureIcons.volume}
                </span>
                <span className="min-w-0 leading-tight">Voz natural</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-[#E4B012]" aria-hidden>
                  {heroFeatureIcons.lock}
                </span>
                <span className="min-w-0 leading-tight">100% personalizable</span>
              </li>
              <li className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 text-[#FE6B45]" aria-hidden>
                  {heroFeatureIcons.shield}
                </span>
                <span className="min-w-0 leading-tight">Seguro y privado</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

const audienceCards = [
  {
    title: "Personas que usan comunicación AAC",
    body: "Una herramienta pensada para su día a día.",
    image: "/images/importante/fondos/1.jpg",
    overlay: "/images/importante/1.png",
  },
  {
    title: "Familias y cuidadores",
    body: "Crea, adapta y acompaña de forma sencilla.",
    image: "/images/importante/fondos/2.jpg",
    overlay: "/images/importante/2.png",
  },
  {
    title: "Profesionales y docentes",
    body: "Gestiona tableros, vocabulario y progreso.",
    image: "/images/importante/fondos/3.jpg",
    overlay: "/images/importante/3.png",
  },
  {
    title: "Escuelas y centros",
    body: "Implementa AAC de forma efectiva y colaborativa.",
    image: "/images/importante/fondos/4.jpg",
    overlay: "/images/importante/4.png",
  },
] as const;

function Audience() {
  return (
    <AnimatedSection
      id="para-quien"
      className="relative z-10 hidden scroll-mt-28 border-b border-black/5 px-4 py-14 sm:px-6 sm:py-20 md:block lg:px-8"
      enableLoop={false}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-forest sm:text-4xl">
          Para todas las personas que quieren decir algo{" "}
          <span className="text-wave">importante.</span>
        </h2>
        <AudienceStampGrid cards={audienceCards} />
      </div>
    </AnimatedSection>
  );
}

const featureItems = [
  {
    title: "Pictogramas claros y personalizables",
    body: "Encuentra, organiza y adapta lo que necesitas.",
    iconWrapClass: "bg-[#FFB3C8]",
    icon: <Sun className="size-7 text-white" strokeWidth={1.75} aria-hidden />,
  },
  {
    title: "Voz natural y realista",
    body: "Usa la voz del dispositivo o voces premium.",
    iconWrapClass: "bg-[#35AA63]",
    icon: <Volume2 className="size-7 text-white" strokeWidth={1.75} aria-hidden />,
  },
  {
    title: "Predicción con IA",
    body: "Te ayuda a encontrar las palabras más rápido.",
    iconWrapClass: "bg-[#FFDB3D]",
    icon: <Wand2 className="size-7 text-white" strokeWidth={1.75} aria-hidden />,
  },
  {
    title: "Funciona siempre",
    body: "Online u offline, en cualquier dispositivo.",
    iconWrapClass: "bg-[#3A7CEC]",
    icon: <Wifi className="size-7 text-white" strokeWidth={1.75} aria-hidden />,
  },
] as const satisfies readonly FeaturesFluyeListItem[];

function Features() {
  return (
    <AnimatedSection
      id="funciones"
      className="border-b border-black/5 bg-[#FFF9F2] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8"
      enableLoop={false}
    >
      <FeaturesFluyeEntrance
        featureItems={featureItems}
        featuresDecorMoverOn={featuresDecorMoverOn}
      />
    </AnimatedSection>
  );
}

function Pricing() {
  return (
    <AnimatedSection
      id="planes"
      className="border-b border-black/5 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      enableLoop={false}
    >
      <PricingEntrance />
    </AnimatedSection>
  );
}

function CtaBanner({ comingSoon }: { comingSoon: boolean }) {
  return (
    <AnimatedSection
      id="recursos"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      enableLoop={false}
    >
      <CtaBannerClient moverEnabled={ctaBannerMoverOn} comingSoon={comingSoon} />
    </AnimatedSection>
  );
}

type LandingPageProps = {
  comingSoon?: boolean
}

export function LandingPage({ comingSoon = true }: LandingPageProps) {
  const { openWaitlist } = useWaitlistModal()
  return (
    <>
      <main className="pt-36 sm:pt-32">
        <Hero comingSoon={comingSoon} onOpenWaitlist={openWaitlist} />
        <Audience />
        <Features />
        <Pricing />
        <CtaBanner comingSoon={comingSoon} />
      </main>
      <MarketingFooter />
    </>
  );
}
