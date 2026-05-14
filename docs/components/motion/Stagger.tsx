'use client'

import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
}

type Props = {
  children: ReactNode
  className?: string
}

export function Stagger({ children, className = '' }: Props) {
  const reduce = useReducedMotion()
  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-8% 0px' }}
    >
      {Children.map(children, (child) => (
        <motion.div variants={item} className="docs-stagger-item">
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
