"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";

import { useDelayedSectionReveal } from "@/components/landing/useDelayedSectionReveal";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

export type AudienceCard = {
  title: string;
  body: string;
  image: string;
  overlay: string;
};

/** Impares: giro hacia la izquierda. Pares: hacia la derecha. */
const TILT_DEG = 3.25;

const STAGGER_S = 0.16;

type AudienceStampGridProps = {
  cards: readonly AudienceCard[];
};

export function AudienceStampGrid({ cards }: AudienceStampGridProps) {
  const containerRef = useRef(null);
  const { revealed: isInView } = useDelayedSectionReveal(containerRef);
  const reduceMotion = useReducedMotion();
  const isMobileLayout = useIsMobileLayout();

  return (
    <div
      ref={containerRef}
      className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-7 lg:gap-8 xl:grid-cols-4"
    >
      {cards.map((card, index) => {
        const order = index + 1;
        const tiltLeft = order % 2 === 1;
        const restRotate = tiltLeft ? -TILT_DEG : TILT_DEG;

        const stampDelay = isMobileLayout ? 0 : index * STAGGER_S;

        return (
          <motion.article
            key={card.title}
            className="flex flex-col gap-3 sm:gap-4"
            initial={
              reduceMotion
                ? { opacity: 1, scale: 1, rotate: restRotate, y: 0 }
                : {
                    opacity: 0,
                    scale: 1.22,
                    rotate: 0,
                    y: 10,
                  }
            }
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, rotate: restRotate, y: 0 }
                : isInView
                  ? {
                      opacity: 1,
                      scale: 1,
                      rotate: restRotate,
                      y: 0,
                    }
                  : {
                      opacity: 0,
                      scale: 1.22,
                      rotate: 0,
                      y: 10,
                    }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    delay: stampDelay,
                    duration: 0.42,
                    ease: [0.22, 1.1, 0.36, 1],
                  }
            }
            style={{ transformOrigin: "center center" }}
          >
            <div
              className="relative aspect-square w-full overflow-hidden rounded-[22px] ring-1 ring-black/[0.07] sm:rounded-[26px]"
              aria-hidden
            >
              <Image
                src={card.image}
                alt=""
                fill
                className="pointer-events-none select-none object-cover"
                sizes="(max-width: 767px) min(92vw, 100vw), (max-width: 1280px) 50vw, 25vw"
              />
              <Image
                src={card.overlay}
                alt=""
                fill
                className="pointer-events-none select-none object-contain"
                sizes="(max-width: 767px) min(92vw, 100vw), (max-width: 1280px) 50vw, 25vw"
              />
            </div>
            <h3 className="text-left text-[19px] font-extrabold leading-snug tracking-tight text-forest">
              {card.title}
            </h3>
            <p className="text-left text-[15px] font-medium leading-relaxed text-forest/70">
              {card.body}
            </p>
          </motion.article>
        );
      })}
    </div>
  );
}
