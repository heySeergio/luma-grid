"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type HTMLMotionProps,
  type UseInViewOptions,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  SECTION_REVEAL_AMOUNT,
  SECTION_REVEAL_MARGIN,
  SECTION_REVEAL_NUDGE_MS,
} from "@/components/landing/sectionReveal";
import { useIsMobileLayout } from "@/lib/hooks/useIsMobileLayout";

type InViewMargin = NonNullable<UseInViewOptions["margin"]>;

const easeOut = [0.22, 1, 0.36, 1] as const;

export type ScrollLoopPreset =
  | "float"
  | "breathe"
  | "drift"
  | "subtle"
  | "sway"
  | "bob"
  | "linger";

type LoopDef = Pick<HTMLMotionProps<"section">, "animate" | "transition">;

function loopFor(
  preset: ScrollLoopPreset,
  reduceMotion: boolean | null,
): LoopDef {
  if (reduceMotion) {
    return {
      animate: { opacity: 1, y: 0, x: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }
  switch (preset) {
    case "breathe":
      return {
        animate: {
          opacity: 1,
          y: [0, -5, 0],
          scale: [1, 1.004, 1],
        },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
        },
      };
    case "drift":
      return {
        animate: {
          opacity: 1,
          y: [0, -6, 0],
          x: [0, 2.5, 0],
        },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
        },
      };
    case "subtle":
      return {
        animate: { opacity: 1, y: [0, -3, 0] },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
        },
      };
    case "sway":
      return {
        animate: { opacity: 1, x: [0, 9, 0], y: 0 },
        transition: {
          opacity: { duration: 0 },
          x: { duration: 6.4, repeat: Infinity, ease: "easeInOut" },
        },
      };
    case "bob":
      return {
        animate: { opacity: 1, y: [0, -9, 0] },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 3.1, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
        },
      };
    case "linger":
      return {
        animate: { opacity: 1, y: [0, -6, 0], x: [0, -2.5, 0] },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
        },
      };
    case "float":
    default:
      return {
        animate: { opacity: 1, y: [0, -7, 0] },
        transition: {
          opacity: { duration: 0 },
          y: { duration: 4.6, repeat: Infinity, ease: "easeInOut" },
        },
      };
  }
}

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  loop?: ScrollLoopPreset;
  /** Si es false, tras la animación de entrada el bloque queda fijo (sin bucle). */
  enableLoop?: boolean;
  /** Fracción del elemento visible para disparar la entrada (0–1). */
  viewportAmount?: number;
  margin?: InViewMargin;
};

/** Props DOM que chocan con la API de gestos/animación de `motion.*`. */
type ConflictingMotionKeys =
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd";

type AnimatedSectionProps = BaseProps &
  Omit<
    React.ComponentPropsWithoutRef<"section">,
    keyof BaseProps | "children" | ConflictingMotionKeys
  >;

/** Pie siempre visible; sin entrada al scroll ni bucles. */
type AnimatedFooterProps = Omit<
  React.ComponentPropsWithoutRef<"footer">,
  ConflictingMotionKeys
> & {
  children: React.ReactNode;
};

type AnimatedHeaderProps = BaseProps &
  Omit<
    React.ComponentPropsWithoutRef<"header">,
    keyof BaseProps | "children" | ConflictingMotionKeys
  >;

const settledAfterEnter: LoopDef = {
  animate: { opacity: 1, y: 0, x: 0, scale: 1 },
  transition: { duration: 0 },
};

function useScrollEnterLoop(
  loop: ScrollLoopPreset,
  enableLoop: boolean,
  viewportAmount: number,
  margin: InViewMargin,
) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const isMobileLayout = useIsMobileLayout();
  const rawInView = useInView(ref, {
    once: true,
    amount: viewportAmount,
    margin,
  });
  const [isInView, setIsInView] = useState(false);
  const [inDone, setInDone] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setIsInView(rawInView);
      return;
    }
    if (!rawInView) {
      setIsInView(false);
      setInDone(false);
      return;
    }
    const nudgeMs = isMobileLayout ? 0 : SECTION_REVEAL_NUDGE_MS;
    const id = window.setTimeout(() => setIsInView(true), nudgeMs);
    return () => window.clearTimeout(id);
  }, [rawInView, reduceMotion, isMobileLayout]);

  const loopDef = enableLoop ? loopFor(loop, reduceMotion) : settledAfterEnter;

  const onAnimationComplete = () => {
    if (!isInView || reduceMotion) return;
    setInDone(true);
  };

  return { ref, reduceMotion, isInView, inDone, loopDef, onAnimationComplete };
}

function enterHiddenProps(reduce: boolean | null): HTMLMotionProps<"section"> {
  if (reduce) {
    return { initial: false, animate: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 38 },
    animate: { opacity: 0, y: 38 },
  };
}

function enterVisibleProps(reduce: boolean | null): HTMLMotionProps<"section"> {
  if (reduce) {
    return { initial: false, animate: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 38 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.58, ease: easeOut },
  };
}

export function AnimatedSection({
  children,
  className,
  id,
  loop = "float",
  enableLoop = true,
  viewportAmount = SECTION_REVEAL_AMOUNT,
  margin = SECTION_REVEAL_MARGIN,
  ...rest
}: AnimatedSectionProps) {
  const { ref, reduceMotion, isInView, inDone, loopDef, onAnimationComplete } =
    useScrollEnterLoop(loop, enableLoop, viewportAmount, margin);

  if (reduceMotion) {
    return (
      <section id={id} className={className} {...rest}>
        {children}
      </section>
    );
  }

  const motionState: HTMLMotionProps<"section"> = !isInView
    ? enterHiddenProps(false)
    : inDone
      ? { initial: false, animate: loopDef.animate, transition: loopDef.transition }
      : enterVisibleProps(false);

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      {...rest}
      {...motionState}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.section>
  );
}

export function AnimatedFooter({
  children,
  className,
  id,
  ...rest
}: AnimatedFooterProps) {
  return (
    <footer id={id} className={className} {...rest}>
      {children}
    </footer>
  );
}

export function AnimatedHeader({
  children,
  className,
  id,
  loop = "float",
  enableLoop = false,
  viewportAmount = 0.05,
  margin = "0px 0px 0px 0px" as InViewMargin,
  ...rest
}: AnimatedHeaderProps) {
  const { ref, reduceMotion, isInView, inDone, loopDef, onAnimationComplete } =
    useScrollEnterLoop(loop, enableLoop, viewportAmount, margin);

  if (reduceMotion) {
    return (
      <header id={id} className={className} {...rest}>
        {children}
      </header>
    );
  }

  const motionState: HTMLMotionProps<"header"> = !isInView
    ? (enterHiddenProps(false) as HTMLMotionProps<"header">)
    : inDone
      ? {
          initial: false,
          animate: loopDef.animate,
          transition: loopDef.transition,
        }
      : (enterVisibleProps(false) as HTMLMotionProps<"header">);

  return (
    <motion.header
      ref={ref}
      id={id}
      className={className}
      {...rest}
      {...motionState}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.header>
  );
}
