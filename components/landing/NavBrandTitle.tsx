"use client";

import { useCallback, useState, type ReactNode } from "react";

/** Colores de hover del título de marca en el nav (ciclo en cada hover). */
const BRAND_HOVER_SWATCHES: { color: string; textShadow?: string }[] = [
  { color: "#35AA63" },
  { color: "#F16641" },
  { color: "#3A7CEC" },
  {
    color: "#FFDB3D",
    textShadow: "0 0 1px rgba(28,43,36,0.35), 0 1px 2px rgba(28,43,36,0.22)",
  },
  {
    color: "#FFB3C8",
    textShadow: "0 0 1px rgba(28,43,36,0.28), 0 1px 2px rgba(28,43,36,0.18)",
  },
];

export function NavBrandTitle({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(-1);
  const [hovered, setHovered] = useState(false);

  const onEnter = useCallback(() => {
    setHovered(true);
    setIndex((prev) => (prev + 1) % BRAND_HOVER_SWATCHES.length);
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const swatch =
    hovered && index >= 0 ? BRAND_HOVER_SWATCHES[index] : null;

  return (
    <span
      className="truncate transition-[color,text-shadow] duration-200 ease-out"
      style={
        swatch
          ? {
              color: swatch.color,
              ...(swatch.textShadow ? { textShadow: swatch.textShadow } : {}),
            }
          : undefined
      }
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  );
}
