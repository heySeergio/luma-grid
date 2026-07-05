export type HeroDecorId = 'tablet' | 'speech' | 'cara' | 'nina'

/** Orden narrativo: tablet fade → cara pop → niña desde la derecha → speech estampa. */
export const HERO_DECOR_MOTION = {
  tablet: {
    fadeIn: { delay: 0, duration: 0.28 },
    loopYAfter: 0.32,
  },
  cara: {
    fadeIn: { delay: 0.18, duration: 0.2 },
    pop: { delay: 0.18, stiffness: 540, damping: 22, mass: 0.72 },
    loopRotateAfter: 0.52,
  },
  nina: {
    fadeIn: { delay: 0.34, duration: 0.22 },
    slide: { delay: 0.34, fromX: 72, duration: 0.34 },
    loopYAfter: 0.72,
  },
  speech: {
    fadeIn: { delay: 0.58, duration: 0.22 },
    stamp: { delay: 0.58, duration: 0.28, ease: [0.22, 1.08, 0.36, 1] as const },
    loopRotateAfter: 0.9,
  },
} as const

export const heroDecorEaseOut = [0.22, 1, 0.36, 1] as const

function decorDelay(seconds: number, mobile: boolean) {
  return mobile ? seconds * 0.35 : seconds
}

export function heroDecorInnerMotion(
  id: HeroDecorId,
  ready: boolean,
  reduceMotion: boolean,
  mobile = false,
): {
  animate: Record<string, number | number[]>
  transition: Record<string, unknown>
} {
  if (reduceMotion) {
    return {
      animate: { scale: 1, x: 0, y: 0, rotate: 0 },
      transition: { duration: 0 },
    }
  }

  if (!ready) {
    switch (id) {
      case 'tablet':
        return { animate: { y: 0 }, transition: { duration: 0 } }
      case 'cara':
        return {
          animate: { scale: 0.64, y: 28, rotate: 0 },
          transition: { duration: 0 },
        }
      case 'nina':
        return {
          animate: { x: HERO_DECOR_MOTION.nina.slide.fromX, y: 0 },
          transition: { duration: 0 },
        }
      case 'speech':
        return {
          animate: { scale: 1.3, rotate: 0, y: 0 },
          transition: { duration: 0 },
        }
      default:
        return { animate: {}, transition: { duration: 0 } }
    }
  }

  switch (id) {
    case 'tablet':
      return {
        animate: { y: [0, -5, 0] },
        transition: {
          y: {
            delay: decorDelay(HERO_DECOR_MOTION.tablet.loopYAfter, mobile),
            duration: 4.4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }
    case 'cara':
      return {
        animate: {
          scale: 1,
          y: 0,
          rotate: [2.2, -2.2, 2.2],
        },
        transition: {
          scale: {
            delay: decorDelay(HERO_DECOR_MOTION.cara.pop.delay, mobile),
            type: 'spring',
            stiffness: HERO_DECOR_MOTION.cara.pop.stiffness,
            damping: HERO_DECOR_MOTION.cara.pop.damping,
            mass: HERO_DECOR_MOTION.cara.pop.mass,
          },
          y: {
            delay: decorDelay(HERO_DECOR_MOTION.cara.pop.delay, mobile),
            type: 'spring',
            stiffness: HERO_DECOR_MOTION.cara.pop.stiffness,
            damping: HERO_DECOR_MOTION.cara.pop.damping,
            mass: HERO_DECOR_MOTION.cara.pop.mass,
          },
          rotate: {
            delay: decorDelay(HERO_DECOR_MOTION.cara.loopRotateAfter, mobile),
            duration: 3.6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }
    case 'nina':
      return {
        animate: {
          x: 0,
          y: [0, -6, 0],
        },
        transition: {
          x: {
            delay: decorDelay(HERO_DECOR_MOTION.nina.slide.delay, mobile),
            duration: HERO_DECOR_MOTION.nina.slide.duration,
            ease: heroDecorEaseOut,
          },
          y: {
            delay: decorDelay(HERO_DECOR_MOTION.nina.loopYAfter, mobile),
            duration: 6.2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }
    case 'speech':
      return {
        animate: {
          scale: 1,
          rotate: [-2.4, 2.4, -2.4],
          y: 0,
        },
        transition: {
          scale: {
            delay: decorDelay(HERO_DECOR_MOTION.speech.stamp.delay, mobile),
            duration: HERO_DECOR_MOTION.speech.stamp.duration,
            ease: HERO_DECOR_MOTION.speech.stamp.ease,
          },
          y: { duration: 0 },
          rotate: {
            delay: decorDelay(HERO_DECOR_MOTION.speech.loopRotateAfter, mobile),
            duration: 4.1,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      }
    default:
      return { animate: {}, transition: {} }
  }
}

export function heroDecorOuterFade(
  id: HeroDecorId,
  ready: boolean,
  reduceMotion: boolean,
  mobile = false,
) {
  if (reduceMotion) {
    return {
      animate: { opacity: 1 },
      transition: { duration: 0 },
    }
  }

  const cfg =
    id === 'tablet'
      ? HERO_DECOR_MOTION.tablet.fadeIn
      : id === 'cara'
        ? HERO_DECOR_MOTION.cara.fadeIn
        : id === 'nina'
          ? HERO_DECOR_MOTION.nina.fadeIn
          : HERO_DECOR_MOTION.speech.fadeIn

  return {
    animate: { opacity: ready ? 1 : 0 },
    transition: {
      duration: ready ? cfg.duration : 0,
      delay: ready ? decorDelay(cfg.delay, mobile) : 0,
      ease: heroDecorEaseOut,
    },
  }
}
