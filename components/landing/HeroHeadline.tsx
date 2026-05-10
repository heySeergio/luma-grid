"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { LevitatingMessyLetters } from "@/components/landing/LevitatingMessyLetters";

function MessyLine({
  children,
  rotation,
  className,
}: {
  children: ReactNode;
  rotation: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-end font-extrabold tracking-[-0.04em] ${className ?? ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {children}
    </span>
  );
}

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Duración del fade por palabra (debe coincidir con el inicio de la levitación). */
const WORD_FADE_DURATION = 0.52;

/** Tiempo hasta que termina el fade de esa palabra; ahí empieza la levitación letra a letra. */
function levitationStartAfterFade(fadeDelay: number) {
  return fadeDelay + WORD_FADE_DURATION;
}

function FadeWord({
  children,
  delay,
}: {
  children: ReactNode;
  delay: number;
}) {
  return (
    <motion.span
      className="inline-flex items-end"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: WORD_FADE_DURATION,
        delay,
        ease: easeOut,
      }}
    >
      {children}
    </motion.span>
  );
}

export function HeroHeadline() {
  return (
    <h1 className="text-balance subpixel-antialiased">
      <div className="flex flex-col gap-1 sm:gap-2 lg:gap-1">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1 sm:gap-x-5">
          <MessyLine
            rotation={-6}
            className="text-[#042D22] text-[clamp(2.5rem,8vw,4.75rem)] leading-[0.95]"
          >
            <FadeWord delay={0}>
              <LevitatingMessyLetters
                text="Tu"
                pattern={[0, 6]}
                levitationStartDelay={levitationStartAfterFade(0)}
              />
            </FadeWord>
            <FadeWord delay={0.16}>
              <LevitatingMessyLetters
                text=" voz."
                pattern={[6, 16, 8, -2]}
                levitationStartDelay={levitationStartAfterFade(0.16)}
              />
            </FadeWord>
          </MessyLine>
          <MessyLine
            rotation={5}
            className="text-[#2F69BA] text-[clamp(2.5rem,8vw,4.75rem)] leading-[0.95]"
          >
            <FadeWord delay={0.34}>
              <LevitatingMessyLetters
                text="Sin"
                pattern={[-4, 8, -2]}
                levitationStartDelay={levitationStartAfterFade(0.34)}
              />
            </FadeWord>
          </MessyLine>
        </div>
        <MessyLine
          rotation={-2}
          className="text-[#FE6B45] text-[clamp(2.75rem,9vw,5.5rem)] leading-[0.92]"
        >
          <FadeWord delay={0.52}>
            <LevitatingMessyLetters
              text="complicaciones."
              pattern={[
                0, -8, 4, -12, 6, -4, 10, -6, 3, -9, 5, -3, 8, -5, 2,
              ]}
              levitationStartDelay={levitationStartAfterFade(0.52)}
            />
          </FadeWord>
        </MessyLine>
      </div>
    </h1>
  );
}
