"use client";

import { useCallback, useState, type ReactNode } from "react";

import { BRAND_NAV_HOVER_SWATCHES } from "@/lib/site/brandNavHoverColors";

export function NavBrandTitle({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(-1);
  const [hovered, setHovered] = useState(false);

  const onEnter = useCallback(() => {
    setHovered(true);
    setIndex((prev) => (prev + 1) % BRAND_NAV_HOVER_SWATCHES.length);
  }, []);

  const onLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const swatch =
    hovered && index >= 0 ? BRAND_NAV_HOVER_SWATCHES[index] : null;

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
