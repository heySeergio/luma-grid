"use client";

import { useSyncExternalStore } from "react";

/** Coincide con breakpoint `md` de Tailwind: viewport &lt; 768px. */
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

/**
 * True en viewports estrechos (&lt; `md`), para animaciones y layout solo-móvil.
 * En SSR devuelve false hasta hidratar.
 */
export function useIsMobileLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
