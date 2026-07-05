"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { FeaturesDriftShell } from "@/components/landing/FeaturesDriftShell";
import { useDelayedSectionReveal } from "@/components/landing/useDelayedSectionReveal";
import { FeaturesFluyeDecors } from "@/components/landing/FeaturesFluyeDecors";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Delay after first headline line (s). */
const HEADLINE_LINE1_DELAY = 0;
/** Second line + underline after first (s). */
const HEADLINE_LINE2_DELAY = 0.1;
/** First feature card after section reveal (s). */
const LIST_BASE_DELAY = 0.4;
/** Between each `<li>` (s). */
const LIST_STAGGER = 0.1;
/** Single entrance segment duration (s). */
const ENTRANCE_DURATION = 0.44;
/** Fade-in de cada ítem de la lista (fluye). */
const LIST_ENTRANCE_DURATION = 0.52;
/** Tras el fade del ítem, inicia el bucle propio (s). */
function makeListLoopDelay(
  base: number,
  stagger: number,
  entranceDuration: number,
) {
  return (index: number) => base + index * stagger + entranceDuration;
}
const LIST_LOOP_FLOAT_Y = [0, -3.2, 0];
const LIST_LOOP_FLOAT_DURATION = 5.5;
const LIST_LOOP_ROTATE = [-1.05, 1.05, -1.05];
const LIST_LOOP_ROTATE_DURATION = 6.2;
/** Wait after section in view before idle→drift loop (s). */
const DRIFT_DELAY_AFTER_REVEAL_SEC = 1.15;

const headlineBlock = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  enter: { opacity: 1, y: 0, scale: 1 },
};

const DOCS_URL = "https://docs.lumagrid.app";

function FeaturesFluyeDocsLink({ className }: { className?: string }) {
  return (
    <p className={className ?? "mt-3 sm:mt-4"}>
      <a
        href={DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-[#1C2B24]/72 underline-offset-4 transition hover:text-[#FE6B45] hover:underline"
      >
        Ver documentación completa
      </a>
    </p>
  );
}

export type FeaturesFluyeListItem = {
  title: string;
  body: string;
  iconWrapClass: string;
  icon: React.ReactNode;
};

type FeaturesFluyeEntranceProps = {
  featureItems: readonly FeaturesFluyeListItem[];
  featuresDecorMoverOn: boolean;
};

export function FeaturesFluyeEntrance({
  featureItems,
  featuresDecorMoverOn,
}: FeaturesFluyeEntranceProps) {
  const rootRef = useRef(null);
  const { revealed: reveal } = useDelayedSectionReveal(rootRef);
  const reduceMotion = useReducedMotion();
  const isMobileLayout = useIsMobileLayout();

  const headlineLine2Delay = isMobileLayout ? 0 : HEADLINE_LINE2_DELAY;
  const listBase = isMobileLayout ? 0 : LIST_BASE_DELAY;
  const listStagger = isMobileLayout ? 0 : LIST_STAGGER;
  const listLoopDelay = makeListLoopDelay(listBase, listStagger, listEntranceDuration);
  const driftDelaySec = isMobileLayout ? 0 : DRIFT_DELAY_AFTER_REVEAL_SEC;
  const entranceDuration = isMobileLayout ? 0.3 : ENTRANCE_DURATION;
  const listEntranceDuration = isMobileLayout ? 0.32 : LIST_ENTRANCE_DURATION;

  if (reduceMotion) {
    return (
      <div ref={rootRef} className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20">
        <div className="relative isolate min-w-0 overflow-visible">
          <div className="relative z-20 max-md:bg-[#FFF9F2]">
          <h2
            id="comunicacion-fluye"
            className="max-w-xl scroll-mt-40 text-3xl font-extrabold leading-[1.12] tracking-tight text-[#1C2B24] sm:scroll-mt-32 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.1]"
          >
            <span className="block">Comunicación</span>
            <span className="mt-1 block sm:mt-1.5">
              <span className="text-[#1C2B24]">que </span>
              <span className="relative inline-block">
                <span className="relative z-10 text-[#FE6B45]">fluye.</span>
                <svg
                  className="pointer-events-none absolute -bottom-1 left-[-2%] right-[-8%] h-3 w-[108%] text-[#FE6B45] sm:h-3.5"
                  viewBox="0 0 140 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M4 10c18-6 38-6 56-1s40 5 58-2"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 11c16-4 34-4 50 0s36 4 52-1"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </svg>
              </span>
            </span>
          </h2>
          <FeaturesFluyeDocsLink />
          </div>

          <FeaturesDriftShell
            className="relative z-0 mx-auto mt-10 block min-h-[min(52dvh,360px)] w-full max-w-lg sm:mt-12 sm:min-h-[380px] max-md:mt-8 lg:mx-0 lg:max-w-none lg:min-h-[420px]"
            driftDelaySec={0}
          >
            <FeaturesFluyeDecors
              moverEnabled={featuresDecorMoverOn}
              entranceActive
              reducedMotion
            />
          </FeaturesDriftShell>
        </div>

        <div className="min-w-0">
          <ul className="grid gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10">
            {featureItems.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div
                  className={`flex size-[3.75rem] shrink-0 items-center justify-center rounded-2xl shadow-sm ${item.iconWrapClass}`}
                  aria-hidden
                >
                  {item.icon}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-[17px] font-extrabold leading-snug text-[#1C2B24] sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#1C2B24]/78">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-20"
    >
      <div className="relative isolate min-w-0 overflow-visible">
        <div className="relative z-20 max-md:bg-[#FFF9F2]">
        <h2
          id="comunicacion-fluye"
          className="max-w-xl scroll-mt-40 text-3xl font-extrabold leading-[1.12] tracking-tight text-[#1C2B24] sm:scroll-mt-32 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.1]"
        >
          <motion.span
            className="block"
            initial={headlineBlock.initial}
            animate={reveal ? headlineBlock.enter : headlineBlock.initial}
            transition={{
              duration: entranceDuration,
              ease: easeOut,
              delay: HEADLINE_LINE1_DELAY,
            }}
          >
            Comunicación
          </motion.span>
          <motion.span
            className="mt-1 block sm:mt-1.5"
            initial={headlineBlock.initial}
            animate={reveal ? headlineBlock.enter : headlineBlock.initial}
            transition={{
              duration: entranceDuration,
              ease: easeOut,
              delay: headlineLine2Delay,
            }}
          >
            <span className="text-[#1C2B24]">que </span>
            <span className="relative inline-block">
              <span className="relative z-10 text-[#FE6B45]">fluye.</span>
              <svg
                className="pointer-events-none absolute -bottom-1 left-[-2%] right-[-8%] h-3 w-[108%] text-[#FE6B45] sm:h-3.5"
                viewBox="0 0 140 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M4 10c18-6 38-6 56-1s40 5 58-2"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 11c16-4 34-4 50 0s36 4 52-1"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.55"
                />
              </svg>
            </span>
          </motion.span>
        </h2>
        <motion.div
          initial={headlineBlock.initial}
          animate={reveal ? headlineBlock.enter : headlineBlock.initial}
          transition={{
            duration: entranceDuration,
            ease: easeOut,
            delay: headlineLine2Delay + (isMobileLayout ? 0 : 0.08),
          }}
        >
          <FeaturesFluyeDocsLink className="relative z-20 mt-3 sm:mt-4" />
        </motion.div>
        </div>

        <FeaturesDriftShell
          className="relative z-0 mx-auto mt-10 block min-h-[min(52dvh,360px)] w-full max-w-lg sm:mt-12 sm:min-h-[380px] max-md:mt-8 lg:mx-0 lg:max-w-none lg:min-h-[420px]"
          driftDelaySec={driftDelaySec}
        >
          <FeaturesFluyeDecors
            moverEnabled={featuresDecorMoverOn}
            entranceActive={reveal}
          />
        </FeaturesDriftShell>
      </div>

      <div className="min-w-0">
        <ul className="grid gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-10">
          {featureItems.map((item, index) => {
            const even = index % 2 === 0;
            const loopDelay = listLoopDelay(index);
            return (
              <motion.li
                key={item.title}
                className="min-w-0"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={
                  reveal
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.94 }
                }
                transition={{
                  duration: listEntranceDuration,
                  ease: easeOut,
                  delay: listBase + index * listStagger,
                }}
              >
                <motion.div
                  className={`flex w-full gap-4 will-change-transform ${
                    even ? "origin-bottom" : "origin-left"
                  }`}
                  initial={false}
                  animate={
                    reveal
                      ? even
                        ? { y: LIST_LOOP_FLOAT_Y }
                        : { rotate: LIST_LOOP_ROTATE }
                      : even
                        ? { y: 0 }
                        : { rotate: 0 }
                  }
                  transition={
                    reveal
                      ? even
                        ? {
                            y: {
                              delay: loopDelay,
                              duration: LIST_LOOP_FLOAT_DURATION,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : {
                            rotate: {
                              delay: loopDelay,
                              duration: LIST_LOOP_ROTATE_DURATION,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                      : { duration: 0 }
                  }
                >
                  <div
                    className={`flex size-[3.75rem] shrink-0 items-center justify-center rounded-2xl shadow-sm ${item.iconWrapClass}`}
                    aria-hidden
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-[17px] font-extrabold leading-snug text-[#1C2B24] sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#1C2B24]/78">
                      {item.body}
                    </p>
                  </div>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
