'use client'

import { useCallback, useId, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type FaqItem = {
  question: string
  answer: string
}

type Props = {
  items: readonly FaqItem[]
}

export default function LandingFaq({ items }: Props) {
  return (
    <div className="mt-8 space-y-3">
      {items.map((item) => (
        <FaqRow key={item.question} item={item} />
      ))}
    </div>
  )
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const panelId = useId()
  const duration = reduceMotion ? 0 : 0.38

  const toggle = useCallback(() => setOpen((o) => !o), [])

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition-shadow dark:border-white/10 dark:bg-white/5 dark:shadow-none ${
        open ? 'shadow-md' : ''
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        id={`${panelId}-btn`}
        onClick={toggle}
        className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:text-white dark:hover:bg-white/5"
      >
        <span className="min-w-0 flex-1">{item.question}</span>
        <motion.span
          aria-hidden
          className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
          initial={false}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: duration * 0.85, ease: [0.4, 0, 0.2, 1] }}
        >
          ▼
        </motion.span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-btn`}
        initial={false}
        animate={{
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{
          height: { duration, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: duration * 0.75, ease: [0.4, 0, 0.2, 1] },
        }}
        className="overflow-hidden"
      >
        <div className="border-t border-slate-100 px-4 pb-4 pt-0 dark:border-white/10">
          <p className="pt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.answer}</p>
        </div>
      </motion.div>
    </div>
  )
}
