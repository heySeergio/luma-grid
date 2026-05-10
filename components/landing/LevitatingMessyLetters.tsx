"use client";

import { motion } from "framer-motion";

type LevitatingMessyLettersProps = {
  text: string;
  pattern: number[];
  /** Retraso entre letras (s) para desincronizar la levitación */
  stagger?: number;
  /** Duración de un ciclo completo de flotación */
  duration?: number;
  /**
   * Segundos de espera antes de que empiece la levitación (p. ej. tras el fade-in de la palabra).
   */
  levitationStartDelay?: number;
};

/** Muestreo de una onda senoidal (bucle perfectamente continuo, sin “trompicones”) */
const FLOAT_STEPS = 28;
function sineFloatKeyframes(amplitude: number) {
  const y = Array.from({ length: FLOAT_STEPS + 1 }, (_, i) => {
    const t = i / FLOAT_STEPS;
    return Math.sin(t * Math.PI * 2) * amplitude;
  });
  const times = Array.from({ length: FLOAT_STEPS + 1 }, (_, i) => i / FLOAT_STEPS);
  return { y, times };
}

export function LevitatingMessyLetters({
  text,
  pattern,
  stagger = 0.07,
  duration = 3.6,
  levitationStartDelay = 0,
}: LevitatingMessyLettersProps) {
  let letterIndex = 0;
  const amp = 4.5;
  const { y: floatY, times: floatTimes } = sineFloatKeyframes(amp);

  return text.split("").map((char, i) => {
    if (char === " ") {
      return (
        <span key={i} className="inline-block w-[0.3em] shrink-0" />
      );
    }

    const baseY = pattern[letterIndex % pattern.length] ?? 0;
    const delay = levitationStartDelay + letterIndex * stagger;
    letterIndex += 1;

    return (
      <span
        key={i}
        className="inline-block"
        style={{ transform: `translateY(${baseY}px)` }}
      >
        <motion.span
          className="inline-block"
          initial={{ y: floatY[0] }}
          animate={{ y: floatY }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
            times: floatTimes,
          }}
        >
          {char}
        </motion.span>
      </span>
    );
  });
}
