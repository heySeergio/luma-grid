"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useState, type RefObject } from "react";

import {
  SECTION_REVEAL_AMOUNT,
  SECTION_REVEAL_AMOUNT_MOBILE,
  SECTION_REVEAL_MARGIN,
  SECTION_REVEAL_MARGIN_MOBILE,
  SECTION_REVEAL_NUDGE_MS,
  type SectionRevealMargin,
} from "@/components/landing/sectionReveal";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

export function useDelayedSectionReveal(
  ref: RefObject<Element | null>,
  overrides?: Partial<{
    amount: number;
    margin: SectionRevealMargin;
    nudgeMs: number;
  }>,
) {
  const isMobileLayout = useIsMobileLayout();
  const amount =
    overrides?.amount ??
    (isMobileLayout ? SECTION_REVEAL_AMOUNT_MOBILE : SECTION_REVEAL_AMOUNT);
  const margin =
    overrides?.margin ??
    (isMobileLayout ? SECTION_REVEAL_MARGIN_MOBILE : SECTION_REVEAL_MARGIN);
  const nudgeMs = overrides?.nudgeMs ?? SECTION_REVEAL_NUDGE_MS;

  const rawInView = useInView(ref, { once: true, amount, margin });
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);

  const effectiveNudgeMs = isMobileLayout ? 0 : nudgeMs;

  useEffect(() => {
    if (reduceMotion) {
      setRevealed(rawInView);
      return;
    }
    if (!rawInView) {
      setRevealed(false);
      return;
    }
    const id = window.setTimeout(() => setRevealed(true), effectiveNudgeMs);
    return () => window.clearTimeout(id);
  }, [rawInView, reduceMotion, effectiveNudgeMs]);

  return { rawInView, revealed: reduceMotion ? rawInView : revealed };
}
