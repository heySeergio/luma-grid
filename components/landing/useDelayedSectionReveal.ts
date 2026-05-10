"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

import {
  SECTION_REVEAL_AMOUNT,
  SECTION_REVEAL_MARGIN,
  SECTION_REVEAL_NUDGE_MS,
  type SectionRevealMargin,
} from "@/components/landing/sectionReveal";

export function useDelayedSectionReveal(
  ref: RefObject<Element | null>,
  overrides?: Partial<{
    amount: number;
    margin: SectionRevealMargin;
    nudgeMs: number;
  }>,
) {
  const amount = overrides?.amount ?? SECTION_REVEAL_AMOUNT;
  const margin = overrides?.margin ?? SECTION_REVEAL_MARGIN;
  const nudgeMs = overrides?.nudgeMs ?? SECTION_REVEAL_NUDGE_MS;

  const rawInView = useInView(ref, { once: true, amount, margin });
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setRevealed(rawInView);
      return;
    }
    if (!rawInView) {
      setRevealed(false);
      return;
    }
    const id = window.setTimeout(() => setRevealed(true), nudgeMs);
    return () => window.clearTimeout(id);
  }, [rawInView, reduceMotion, nudgeMs]);

  return { rawInView, revealed: reduceMotion ? rawInView : revealed };
}
