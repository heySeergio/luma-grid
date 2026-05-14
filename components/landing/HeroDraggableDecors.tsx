"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

const STORAGE_KEY = "luma-grid-hero-svg-positions";

export type DecorId = "tablet" | "speech" | "cara" | "nina";

export type DecorPositions = Record<DecorId, { x: number; y: number }>;

const DEFAULT_POSITIONS: DecorPositions = {
  tablet: { x: 0, y: 0 },
  speech: { x: 0, y: 0 },
  cara: { x: 0, y: 0 },
  nina: { x: 0, y: 0 },
};

const NINA_SRC = `/images/hero/${encodeURIComponent("Niña.svg")}`;

/** Misma altura inferior; el speech va un poco más a la izquierda que la tablet. */
const HERO_TABLET_SPEECH_BOTTOM =
  "bottom-[7.15rem] sm:bottom-[8.15rem] lg:bottom-[9.65rem]";
const TABLET_LAYOUT_ANCHOR = `${HERO_TABLET_SPEECH_BOTTOM} left-[41%] sm:left-[47%] lg:left-[55%]`;
const SPEECH_LAYOUT_ANCHOR = `${HERO_TABLET_SPEECH_BOTTOM} left-[38%] sm:left-[44%] lg:left-[52%]`;

/** Tiempo en cada frame antes de pasar al siguiente: 0→3s, 1–4→2s, 5→5s y vuelta a 0. */
const TABLET_FRAME_MS = [3000, 2000, 2000, 2000, 2000, 5000] as const;
const TABLET_FRAME_COUNT = TABLET_FRAME_MS.length;

const DECORS: {
  id: DecorId;
  src: string;
  width: number;
  height: number;
  wrapClass: string;
}[] = [
  {
    id: "tablet",
    src: "/images/hero/tablet/0.png",
    width: 1213,
    height: 911,
    wrapClass: `${TABLET_LAYOUT_ANCHOR} w-[min(88vw,20rem)] sm:w-[min(82vw,26rem)] lg:w-[min(42vw,32rem)]`,
  },
  {
    id: "speech",
    src: "/images/hero/Speech.svg",
    width: 385,
    height: 292,
    wrapClass: `${SPEECH_LAYOUT_ANCHOR} z-10 w-[8.125rem] sm:w-[9.425rem] lg:w-[10.4rem]`,
  },
  {
    id: "cara",
    src: "/images/hero/Cara.svg",
    width: 255,
    height: 260,
    wrapClass:
      "left-[64%] top-2 z-10 w-[5.4rem] sm:left-[69%] sm:top-3 sm:w-[6rem] lg:left-[78.5%] lg:top-[1.1rem]",
  },
  {
    id: "nina",
    src: NINA_SRC,
    width: 640,
    height: 548,
    wrapClass:
      "bottom-20 right-[12%] w-[min(46vw,11.5rem)] sm:bottom-24 sm:right-[15%] sm:w-[13rem] lg:bottom-[7rem] lg:right-[17%] lg:w-[14.5rem]",
  },
];

/** Orden narrativo: tablet fade → cara pop → niña desde la derecha → speech estampa (timings compactos). */
const HERO = {
  tablet: {
    fadeIn: { delay: 0, duration: 0.28 },
    loopYAfter: 0.32,
  },
  cara: {
    fadeIn: { delay: 0.18, duration: 0.2 },
    pop: { delay: 0.18, stiffness: 540, damping: 22, mass: 0.72 },
    loopRotateAfter: 0.52,
  },
  nina: {
    fadeIn: { delay: 0.34, duration: 0.22 },
    slide: { delay: 0.34, fromX: 72, duration: 0.34 },
    loopYAfter: 0.72,
  },
  speech: {
    fadeIn: { delay: 0.58, duration: 0.22 },
    stamp: { delay: 0.58, duration: 0.28, ease: [0.22, 1.08, 0.36, 1] as const },
    loopRotateAfter: 0.9,
  },
} as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

function loadStoredPositions(): DecorPositions {
  if (typeof window === "undefined") return DEFAULT_POSITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITIONS;
    const parsed = JSON.parse(raw) as Partial<DecorPositions>;
    return {
      tablet: parsed.tablet ?? DEFAULT_POSITIONS.tablet,
      speech: parsed.speech ?? DEFAULT_POSITIONS.speech,
      cara: parsed.cara ?? DEFAULT_POSITIONS.cara,
      nina: parsed.nina ?? DEFAULT_POSITIONS.nina,
    };
  } catch {
    return DEFAULT_POSITIONS;
  }
}

function innerMotionFor(
  id: DecorId,
  positionsReady: boolean,
  reduceMotion: boolean,
): {
  animate: Record<string, number | number[]>;
  transition: Record<string, unknown>;
} {
  if (reduceMotion) {
    return {
      animate: { scale: 1, x: 0, y: 0, rotate: 0 },
      transition: { duration: 0 },
    };
  }

  if (!positionsReady) {
    switch (id) {
      case "tablet":
        return { animate: { y: 0 }, transition: { duration: 0 } };
      case "cara":
        return {
          animate: { scale: 0.64, y: 28, rotate: 0 },
          transition: { duration: 0 },
        };
      case "nina":
        return {
          animate: { x: HERO.nina.slide.fromX, y: 0 },
          transition: { duration: 0 },
        };
      case "speech":
        return {
          animate: { scale: 1.3, rotate: 0, y: 0 },
          transition: { duration: 0 },
        };
      default:
        return { animate: {}, transition: { duration: 0 } };
    }
  }

  switch (id) {
    case "tablet":
      return {
        animate: { y: [0, -5, 0] },
        transition: {
          y: {
            delay: HERO.tablet.loopYAfter,
            duration: 4.4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };
    case "cara":
      return {
        animate: {
          scale: 1,
          y: 0,
          rotate: [2.2, -2.2, 2.2],
        },
        transition: {
          scale: {
            delay: HERO.cara.pop.delay,
            type: "spring",
            stiffness: HERO.cara.pop.stiffness,
            damping: HERO.cara.pop.damping,
            mass: HERO.cara.pop.mass,
          },
          y: {
            delay: HERO.cara.pop.delay,
            type: "spring",
            stiffness: HERO.cara.pop.stiffness,
            damping: HERO.cara.pop.damping,
            mass: HERO.cara.pop.mass,
          },
          rotate: {
            delay: HERO.cara.loopRotateAfter,
            duration: 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };
    case "nina":
      return {
        animate: {
          x: 0,
          y: [0, -6, 0],
        },
        transition: {
          x: {
            delay: HERO.nina.slide.delay,
            duration: HERO.nina.slide.duration,
            ease: easeOut,
          },
          y: {
            delay: HERO.nina.loopYAfter,
            duration: 6.2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };
    case "speech":
      return {
        animate: {
          scale: 1,
          rotate: [-2.4, 2.4, -2.4],
          y: 0,
        },
        transition: {
          scale: {
            delay: HERO.speech.stamp.delay,
            duration: HERO.speech.stamp.duration,
            ease: HERO.speech.stamp.ease,
          },
          y: { duration: 0 },
          rotate: {
            delay: HERO.speech.loopRotateAfter,
            duration: 4.1,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };
    default:
      return { animate: {}, transition: {} };
  }
}

function outerFadeFor(
  id: DecorId,
  positionsReady: boolean,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    return {
      animate: { opacity: 1 },
      transition: { duration: 0 },
    };
  }
  const cfg =
    id === "tablet"
      ? HERO.tablet.fadeIn
      : id === "cara"
        ? HERO.cara.fadeIn
        : id === "nina"
          ? HERO.nina.fadeIn
          : HERO.speech.fadeIn;

  return {
    animate: { opacity: positionsReady ? 1 : 0 },
    transition: {
      duration: positionsReady ? cfg.duration : 0,
      delay: positionsReady ? cfg.delay : 0,
      ease: easeOut,
    },
  };
}

type HeroDraggableDecorsProps = {
  moverEnabled: boolean;
};

export function HeroDraggableDecors({ moverEnabled }: HeroDraggableDecorsProps) {
  const [positions, setPositions] = useState<DecorPositions>(DEFAULT_POSITIONS);
  const [positionsReady, setPositionsReady] = useState(false);
  const [tabletFrame, setTabletFrame] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const hideHeroDecorsOnMobile = useIsMobileLayout();

  useEffect(() => {
    startTransition(() => {
      setPositions(loadStoredPositions());
      setPositionsReady(true);
    });
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || hideHeroDecorsOnMobile) return;
    const id = window.setTimeout(() => {
      setTabletFrame((f) => (f + 1) % TABLET_FRAME_COUNT);
    }, TABLET_FRAME_MS[tabletFrame]);
    return () => window.clearTimeout(id);
  }, [tabletFrame, prefersReducedMotion, hideHeroDecorsOnMobile]);

  const persist = useCallback((next: DecorPositions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const onDragEnd = useCallback(
    (id: DecorId, _e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setPositions((prev) => {
        const next: DecorPositions = {
          ...prev,
          [id]: {
            x: prev[id].x + info.offset.x,
            y: prev[id].y + info.offset.y,
          },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  if (hideHeroDecorsOnMobile) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 right-0 top-3 sm:top-4 ${
        moverEnabled ? "z-[15]" : "z-[5]"
      }`}
      aria-hidden
    >
      {DECORS.map((decor) => {
        const pos = positions[decor.id];
        const reduceMotion = Boolean(prefersReducedMotion);
        const outer = outerFadeFor(decor.id, positionsReady, reduceMotion);
        const inner = innerMotionFor(decor.id, positionsReady, reduceMotion);

        const moverClass = moverEnabled
          ? "pointer-events-auto cursor-grab touch-none select-none active:cursor-grabbing"
          : "pointer-events-none";

        const motionStyle = {
          aspectRatio: `${decor.width} / ${decor.height}`,
          x: pos.x,
          y: pos.y,
        } as const;

        const innerBlock = (
          <motion.div
            className="relative h-full w-full origin-center will-change-transform [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]"
            initial={false}
            animate={inner.animate}
            transition={inner.transition}
          >
            <Image
              src={
                decor.id === "tablet"
                  ? `/images/hero/tablet/${reduceMotion ? 0 : tabletFrame}.png`
                  : decor.src
              }
              alt=""
              fill
              draggable={false}
              className="pointer-events-none object-contain select-none"
              sizes="(max-width: 768px) 40vw, 34rem"
              unoptimized
              priority={decor.id === "tablet"}
            />
          </motion.div>
        );

        return (
          <motion.div
            key={decor.id}
            className={`absolute ${decor.wrapClass} ${moverClass}`}
            style={motionStyle}
            initial={false}
            animate={outer.animate}
            transition={outer.transition}
            drag={moverEnabled}
            dragMomentum={false}
            onDragStart={(e) => e.preventDefault()}
            onDragEnd={(e, info) => onDragEnd(decor.id, e, info)}
          >
            {innerBlock}
          </motion.div>
        );
      })}
    </div>
  );
}
