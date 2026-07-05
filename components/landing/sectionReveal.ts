import type { UseInViewOptions } from "framer-motion";

export type SectionRevealMargin = NonNullable<UseInViewOptions["margin"]>;

/**
 * El borde inferior del viewport “sube”: hace falta más scroll para disparar
 * (no animar cuando la sección solo asoma por abajo).
 */
export const SECTION_REVEAL_MARGIN: SectionRevealMargin =
  "0px 0px -26% 0px" as SectionRevealMargin;

/** Fracción del elemento que debe ser visible antes de disparar. */
export const SECTION_REVEAL_AMOUNT = 0.35;

/**
 * Móvil: dispara antes (poco scroll + zona ampliada hacia abajo).
 * En pantallas altas el umbral desktop deja el contenido invisible demasiado tiempo.
 */
export const SECTION_REVEAL_MARGIN_MOBILE: SectionRevealMargin =
  "0px 0px 14% 0px" as SectionRevealMargin;

export const SECTION_REVEAL_AMOUNT_MOBILE = 0.06;

/** ms tras cruzar el umbral — retraso mínimo antes de animar. */
export const SECTION_REVEAL_NUDGE_MS = 75;

export const sectionRevealInViewOptions = {
  once: true as const,
  amount: SECTION_REVEAL_AMOUNT,
  margin: SECTION_REVEAL_MARGIN,
};

export function sectionRevealInViewOptionsFor(isMobile: boolean) {
  return {
    once: true as const,
    amount: isMobile ? SECTION_REVEAL_AMOUNT_MOBILE : SECTION_REVEAL_AMOUNT,
    margin: isMobile ? SECTION_REVEAL_MARGIN_MOBILE : SECTION_REVEAL_MARGIN,
  };
}
