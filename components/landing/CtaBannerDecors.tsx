"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, type PanInfo, useReducedMotion } from "framer-motion";

const STORAGE_KEY = "luma-grid-cta-banner-positions";

export type CtaDecorId = "bush1" | "boy" | "cat";

export type CtaDecorPositions = Record<CtaDecorId, { x: number; y: number }>;

const DEFAULT_POSITIONS: CtaDecorPositions = {
  bush1: { x: 0, y: 0 },
  boy: { x: 0, y: 0 },
  cat: { x: 0, y: 0 },
};

const BASE = encodeURI("/images/Empieza a comunicarte");
const BUSH1_SRC = `${BASE}/Arbusto1.png`;
const CAT_SRC = `${BASE}/Gato.png`;
const BOY_SRC = encodeURI("/images/Empieza a comunicarte/Niño.png");

/** Duración del fade-in de cada elemento animado (s). */
export const CTA_ENTRANCE_DURATION = 0.5;
/** Retraso aplicado a toda la secuencia (texto + ilustraciones). */
export const CTA_GLOBAL_OFFSET_SEC = 0.5;
/** Tras niño + arbusto, las burbujas entran (s). Alineado al fade del texto. */
export const CTA_DELAY_BUBBLES_AFTER_FIRST = 0.12;
/** El gato entra este tiempo después del *inicio* de las burbujas (s). */
export const CTA_DELAY_CAT_AFTER_BUBBLES_START = 0.28;
/** El corazón entra este tiempo después del *inicio* del gato (s). */
export const CTA_DELAY_HEART_AFTER_CAT_START = 0.18;

const CAT_DELAY_FROM_SEQUENCE_ZERO =
  CTA_DELAY_BUBBLES_AFTER_FIRST + CTA_DELAY_CAT_AFTER_BUBBLES_START;
const CAT_DELAY_FROM_START = CAT_DELAY_FROM_SEQUENCE_ZERO + CTA_GLOBAL_OFFSET_SEC;
const HEART_DELAY_FROM_START =
  CAT_DELAY_FROM_SEQUENCE_ZERO +
  CTA_DELAY_HEART_AFTER_CAT_START +
  CTA_GLOBAL_OFFSET_SEC;

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Inicio del bucle tras terminar el fade-in de ese elemento. */
function loopStartAfterEntrance(entranceDelaySec: number) {
  return entranceDelaySec + CTA_ENTRANCE_DURATION;
}

const SPEECH_ROTATE = [-2.6, 2.6, -2.6];
const SPEECH_SWAY_DURATION = 4.4;

const HEART_ROTATE = [-18, -12, -18];
const HEART_SWAY_DURATION = 3.8;

const BUSH_FLOAT_Y = [0, -5.5, 0];
const BUSH_FLOAT_DURATION = 6.2;

const CAT_DRIFT_X = [0, 4.5, 0];
const CAT_DRIFT_DURATION = 4.8;

const BOY_LEVITATE_Y = [0, -6.5, 0];
const BOY_LEVITATE_DURATION = 8.5;

const DECORS: {
  id: CtaDecorId;
  src: string;
  width: number;
  height: number;
  wrapClass: string;
  zClass: string;
}[] = [
  {
    id: "boy",
    src: BOY_SRC,
    width: 620,
    height: 760,
    wrapClass:
      "bottom-[-3%] right-[6%] w-[64%] sm:bottom-[-2%] sm:right-[8%] sm:w-[60%]",
    zClass: "z-[5]",
  },
  {
    id: "bush1",
    src: BUSH1_SRC,
    width: 600,
    height: 500,
    wrapClass:
      "bottom-[-12%] left-[-12%] w-[32%] sm:bottom-[-10%] sm:w-[29%]",
    zClass: "z-[7]",
  },
  {
    id: "cat",
    src: CAT_SRC,
    width: 320,
    height: 380,
    wrapClass:
      "bottom-[-8%] left-[21%] w-[20%] sm:bottom-[-6%] sm:left-[23%] sm:w-[17%]",
    zClass: "z-[8]",
  },
];

function loadStoredPositions(): CtaDecorPositions {
  if (typeof window === "undefined") return DEFAULT_POSITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITIONS;
    const parsed = JSON.parse(raw) as Partial<CtaDecorPositions>;
    return {
      bush1: parsed.bush1 ?? DEFAULT_POSITIONS.bush1,
      boy: parsed.boy ?? DEFAULT_POSITIONS.boy,
      cat: parsed.cat ?? DEFAULT_POSITIONS.cat,
    };
  } catch {
    return DEFAULT_POSITIONS;
  }
}

function delayForDecor(id: CtaDecorId): number {
  if (id === "boy" || id === "bush1") return CTA_GLOBAL_OFFSET_SEC;
  return CAT_DELAY_FROM_START;
}

type CtaBannerDecorsProps = {
  moverEnabled: boolean;
  /** La sección está en vista (o preferimos movimiento reducido). */
  entranceStarted: boolean;
  /** Estado final sin animación (p. ej. `prefers-reduced-motion`). */
  instantEntrance: boolean;
  /** Tras hidratar posiciones desde localStorage (para alinear copia y decors). */
  onPositionsHydrated?: () => void;
};

export function CtaBannerDecors({
  moverEnabled,
  entranceStarted,
  instantEntrance,
  onPositionsHydrated,
}: CtaBannerDecorsProps) {
  const [positions, setPositions] = useState<CtaDecorPositions>(DEFAULT_POSITIONS);
  const hookReduced = useReducedMotion();

  useEffect(() => {
    startTransition(() => {
      setPositions(loadStoredPositions());
      onPositionsHydrated?.();
    });
  }, [onPositionsHydrated]);

  const instant = instantEntrance || hookReduced === true;
  /** No bloquear el fade por la lectura de localStorage (posiciones ya parten de DEFAULT). */
  const sequenceGo = instant || entranceStarted;
  const loopsOn = sequenceGo && !instant;

  const persist = useCallback((next: CtaDecorPositions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const onDragEnd = useCallback(
    (id: CtaDecorId, _e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setPositions((prev) => {
        const next: CtaDecorPositions = {
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

  const bubbleTransition = useMemo(() => {
    if (!sequenceGo) return { duration: 0 };
    if (instant) return { duration: 0 };
    return {
      duration: CTA_ENTRANCE_DURATION,
      ease: easeOut,
      delay: CTA_DELAY_BUBBLES_AFTER_FIRST + CTA_GLOBAL_OFFSET_SEC,
    };
  }, [instant, sequenceGo]);

  const heartTransition = useMemo(() => {
    if (!sequenceGo) return { duration: 0 };
    if (instant) return { duration: 0 };
    return {
      duration: CTA_ENTRANCE_DURATION,
      ease: easeOut,
      delay: HEART_DELAY_FROM_START,
    };
  }, [instant, sequenceGo]);

  const decorTransition = (delay: number) => {
    if (!sequenceGo) return { duration: 0 };
    if (instant) return { duration: 0 };
    return {
      duration: CTA_ENTRANCE_DURATION,
      ease: easeOut,
      delay,
    };
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-visible ${
        moverEnabled ? "z-[18]" : "z-[3]"
      }`}
      aria-hidden
    >
      <motion.div
        className="pointer-events-none absolute left-[24%] top-[64%] z-[6] w-[5.5%] sm:left-[28%] sm:top-[62%] sm:w-[5%]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: sequenceGo ? 1 : 0 }}
        transition={heartTransition}
      >
        <motion.div
          className="origin-center will-change-transform"
          initial={false}
          animate={{ rotate: loopsOn ? HEART_ROTATE : -15 }}
          transition={{
            rotate: loopsOn
              ? {
                  delay: loopStartAfterEntrance(HEART_DELAY_FROM_START),
                  duration: HEART_SWAY_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0 },
          }}
        >
          <svg
            viewBox="0 0 32 30"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.08)]"
          >
            <path
              d="M16 27.5S2.5 19.6 2.5 10.6c0-4.5 3.4-7.6 7.4-7.6 2.6 0 4.7 1.3 6.1 3.4 1.4-2.1 3.5-3.4 6.1-3.4 4 0 7.4 3.1 7.4 7.6 0 9-13.5 16.9-13.5 16.9z"
              fill="#E8583E"
            />
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-[34%] top-[6%] z-[6] w-[16%] [transform:scaleX(-1)] sm:left-[36%] sm:top-[4%] sm:w-[14%]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: sequenceGo ? 1 : 0 }}
        transition={bubbleTransition}
      >
        <motion.div
          className="origin-[55%_40%] will-change-transform"
          initial={false}
          animate={{ rotate: loopsOn ? SPEECH_ROTATE : 0 }}
          transition={{
            rotate: loopsOn
              ? {
                  delay: loopStartAfterEntrance(
                    CTA_DELAY_BUBBLES_AFTER_FIRST + CTA_GLOBAL_OFFSET_SEC,
                  ),
                  duration: SPEECH_SWAY_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0 },
          }}
        >
          <svg
            viewBox="0 0 150 120"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.1)]"
          >
            <path
              d="M75 8c-37 0-65 18-65 40 0 14 11 26 28 33l-6 22c-1 4 3 7 6 4l21-15c5 1 11 2 16 2 37 0 65-18 65-46s-28-40-65-40z"
              fill="#3A7CEC"
            />
            <path
              d="M40 50 q6 -10 12 0 t12 0 t12 0 t12 0 t12 0"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M40 70 q6 -10 12 0 t12 0 t12 0 t12 0 t12 0"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute right-[2%] top-[8%] z-[6] w-[12%] sm:right-[3%] sm:top-[6%] sm:w-[10%]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: sequenceGo ? 1 : 0 }}
        transition={bubbleTransition}
      >
        <motion.div
          className="origin-[45%_35%] will-change-transform"
          initial={false}
          animate={{
            rotate: loopsOn ? [SPEECH_ROTATE[2], SPEECH_ROTATE[1], SPEECH_ROTATE[0]] : 0,
          }}
          transition={{
            rotate: loopsOn
              ? {
                  delay:
                    loopStartAfterEntrance(
                      CTA_DELAY_BUBBLES_AFTER_FIRST + CTA_GLOBAL_OFFSET_SEC,
                    ) + 0.12,
                  duration: SPEECH_SWAY_DURATION + 0.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0 },
          }}
        >
          <svg
            viewBox="0 0 130 110"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.1)]"
          >
            <path
              d="M65 6c-32 0-58 17-58 38 0 13 10 24 25 31l-5 20c-1 4 3 6 6 4l19-14c4 1 9 1 13 1 32 0 58-17 58-43s-26-37-58-37z"
              fill="#E8583E"
            />
            <circle cx="38" cy="46" r="6" fill="white" />
            <path
              d="M58 42 q7 -12 14 0 t14 0 t14 0"
              stroke="white"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </motion.div>

      {DECORS.map((decor) => {
        const pos = positions[decor.id];
        const d = delayForDecor(decor.id);
        const loopDelay = loopStartAfterEntrance(d);

        const innerMotion = (() => {
          if (!loopsOn) {
            return {
              animate: { x: 0, y: 0 },
              transition: { duration: 0 },
            };
          }
          if (decor.id === "boy") {
            return {
              animate: { y: BOY_LEVITATE_Y },
              transition: {
                y: {
                  delay: loopDelay,
                  duration: BOY_LEVITATE_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                },
              },
            };
          }
          if (decor.id === "bush1") {
            return {
              animate: { y: BUSH_FLOAT_Y },
              transition: {
                y: {
                  delay: loopDelay,
                  duration: BUSH_FLOAT_DURATION,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                },
              },
            };
          }
          return {
            animate: { x: CAT_DRIFT_X },
            transition: {
              x: {
                delay: loopDelay,
                duration: CAT_DRIFT_DURATION,
                repeat: Infinity,
                ease: "easeInOut" as const,
              },
            },
          };
        })();

        return (
          <motion.div
            key={decor.id}
            className={`absolute ${decor.wrapClass} ${decor.zClass} ${
              moverEnabled
                ? "pointer-events-auto cursor-grab touch-none select-none active:cursor-grabbing"
                : "pointer-events-none"
            }`}
            style={{
              aspectRatio: `${decor.width} / ${decor.height}`,
              x: pos.x,
              y: pos.y,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: sequenceGo ? 1 : 0 }}
            transition={decorTransition(d)}
            drag={moverEnabled}
            dragMomentum={false}
            onDragStart={(e) => e.preventDefault()}
            onDragEnd={(e, info) => onDragEnd(decor.id, e, info)}
          >
            <motion.div
              className="relative h-full w-full origin-bottom will-change-transform [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]"
              initial={false}
              animate={innerMotion.animate}
              transition={innerMotion.transition}
            >
              <Image
                src={decor.src}
                alt=""
                fill
                draggable={false}
                className="object-contain object-bottom"
                sizes="(max-width: 640px) 50vw, 32rem"
                priority={false}
              />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
