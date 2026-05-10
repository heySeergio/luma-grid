"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { sectionRevealInViewOptions } from "@/components/landing/sectionReveal";

/** Mismo patrón que `loop="drift"` en `AnimatedSection`, solo para un subárbol. */
const driftY = [0, -6, 0];
const driftX = [0, 2.5, 0];

export function FeaturesDriftShell({
  children,
  className,
  /**
   * Segundos tras quedar `inView` antes de iniciar el loop de deriva.
   * Evita que el idle móvil compita con la entrada escalonada.
   */
  driftDelaySec = 0,
}: {
  children: React.ReactNode;
  className?: string;
  driftDelaySec?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, sectionRevealInViewOptions);
  const reduce = useReducedMotion();
  const [driftOn, setDriftOn] = useState(driftDelaySec <= 0);

  useEffect(() => {
    if (reduce || driftDelaySec <= 0) {
      setDriftOn(true);
      return;
    }
    if (!inView) {
      setDriftOn(false);
      return;
    }
    setDriftOn(false);
    const t = window.setTimeout(() => setDriftOn(true), driftDelaySec * 1000);
    return () => clearTimeout(t);
  }, [inView, driftDelaySec, reduce]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const driftActive = inView && driftOn;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: 0, x: 0 }}
      animate={driftActive ? { y: driftY, x: driftX } : { y: 0, x: 0 }}
      transition={{
        y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
        x: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {children}
    </motion.div>
  );
}
