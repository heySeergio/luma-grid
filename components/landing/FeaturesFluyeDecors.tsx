"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

const STORAGE_KEY = "luma-grid-features-fluye-positions";

export type FluyeDecorId = "plant" | "boy";

export type FluyeDecorPositions = Record<FluyeDecorId, { x: number; y: number }>;

const DEFAULT_POSITIONS: FluyeDecorPositions = {
  plant: { x: 0, y: 0 },
  boy: { x: 0, y: 0 },
};

const BOY_SRC = `/images/fluye/${encodeURIComponent("niño.png")}`;
const PLANT_SRC = "/images/fluye/planta.png";

const DECORS: {
  id: FluyeDecorId;
  src: string;
  width: number;
  height: number;
  wrapClass: string;
  zClass: string;
}[] = [
  {
    id: "plant",
    src: PLANT_SRC,
    width: 400,
    height: 560,
    wrapClass:
      "bottom-24 -left-2 w-[min(32%,11rem)] sm:bottom-28 sm:-left-3 sm:w-[min(30%,10.5rem)]",
    zClass: "z-0",
  },
  {
    id: "boy",
    src: BOY_SRC,
    width: 960,
    height: 1040,
    wrapClass:
      "bottom-24 left-[22%] w-[min(90%,26rem)] sm:bottom-28 sm:left-[26%] sm:w-[min(88%,28rem)]",
    zClass: "z-10",
  },
];

function loadStoredPositions(): FluyeDecorPositions {
  if (typeof window === "undefined") return DEFAULT_POSITIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITIONS;
    const parsed = JSON.parse(raw) as Partial<FluyeDecorPositions>;
    return {
      plant: parsed.plant ?? DEFAULT_POSITIONS.plant,
      boy: parsed.boy ?? DEFAULT_POSITIONS.boy,
    };
  } catch {
    return DEFAULT_POSITIONS;
  }
}

const ENTRANCE_DURATION = 0.45;
const easeOut = [0.22, 1, 0.36, 1] as const;

/** Retraso respecto a `entranceActive` (s), alineado con el titular. */
const ENTRANCE_DELAY_PLANT_SEC = 0.14;
const ENTRANCE_DELAY_BOY_SEC = 0.24;

/** Giro suave en bucle (planta), tras terminar el fade-in. */
const PLANT_SWAY_DEG = 3.2;
const PLANT_SWAY_DURATION_SEC = 4.6;

type FeaturesFluyeDecorsProps = {
  moverEnabled: boolean;
  /** Fade-in de la ilustración al revelar la sección (una sola vez). */
  entranceActive?: boolean;
  /** Evita `useReducedMotion` dentro del mismo árbol que el padre ya filtró. */
  reducedMotion?: boolean;
};

export function FeaturesFluyeDecors({
  moverEnabled,
  entranceActive = true,
  reducedMotion: reducedMotionProp,
}: FeaturesFluyeDecorsProps) {
  const reducedHook = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? reducedHook;

  const [positions, setPositions] = useState<FluyeDecorPositions>(DEFAULT_POSITIONS);
  const [positionsReady, setPositionsReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setPositions(loadStoredPositions());
      setPositionsReady(true);
    });
  }, []);

  const persist = useCallback((next: FluyeDecorPositions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const onDragEnd = useCallback(
    (id: FluyeDecorId, _e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setPositions((prev) => {
        const next: FluyeDecorPositions = {
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

  const reveal = positionsReady && entranceActive;
  const delayFor = (id: FluyeDecorId) =>
    id === "plant" ? ENTRANCE_DELAY_PLANT_SEC : ENTRANCE_DELAY_BOY_SEC;

  const plantLoopDelay =
    ENTRANCE_DELAY_PLANT_SEC + ENTRANCE_DURATION;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-visible ${
        moverEnabled ? "z-[18]" : "z-[8]"
      }`}
      aria-hidden
    >
      {DECORS.map((decor) => {
        const pos = positions[decor.id];

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
              opacity: reducedMotion ? 1 : 0,
            }}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={
              reducedMotion
                ? { opacity: 1 }
                : reveal
                  ? { opacity: 1 }
                  : { opacity: 0 }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: ENTRANCE_DURATION,
                    ease: easeOut,
                    delay: reveal ? delayFor(decor.id) : 0,
                  }
            }
            drag={moverEnabled}
            dragMomentum={false}
            onDragStart={(e) => e.preventDefault()}
            onDragEnd={(e, info) => onDragEnd(decor.id, e, info)}
          >
            {decor.id === "plant" && !reducedMotion ? (
              <motion.div
                className="relative h-full w-full origin-bottom will-change-transform [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]"
                initial={false}
                animate={
                  reveal
                    ? { rotate: [-PLANT_SWAY_DEG, PLANT_SWAY_DEG, -PLANT_SWAY_DEG] }
                    : { rotate: 0 }
                }
                transition={{
                  rotate: {
                    delay: reveal ? plantLoopDelay : 0,
                    duration: PLANT_SWAY_DURATION_SEC,
                    repeat: reveal ? Infinity : 0,
                    ease: "easeInOut",
                  },
                }}
              >
                <Image
                  src={decor.src}
                  alt=""
                  fill
                  draggable={false}
                  className="object-contain object-bottom"
                  sizes="(max-width: 640px) 45vw, 28rem"
                  priority={false}
                />
              </motion.div>
            ) : (
              <div className="relative h-full w-full [&_img]:pointer-events-none [&_img]:select-none [&_img]:[-webkit-user-drag:none]">
                <Image
                  src={decor.src}
                  alt=""
                  fill
                  draggable={false}
                  className="object-contain object-bottom"
                  sizes="(max-width: 640px) 45vw, 28rem"
                  priority={false}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
