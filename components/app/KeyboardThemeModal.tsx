'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { KeyboardThemeColors } from '@/lib/keyboard/theme'
import KeyboardThemeEditor from '@/components/app/KeyboardThemeEditor'

type Props = {
  open: boolean
  initialTheme: KeyboardThemeColors | null
  profileName: string
  onClose: () => void
  onSave: (theme: KeyboardThemeColors) => Promise<{ ok: boolean; error?: string }>
}

export default function KeyboardThemeModal({
  open,
  initialTheme,
  profileName,
  onClose,
  onSave,
}: Props) {
  const handleSave = async (theme: KeyboardThemeColors) => {
    const res = await onSave(theme)
    if (res.ok) onClose()
    return res
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--app-modal-backdrop)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-labelledby="keyboard-theme-title"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="ui-modal-panel relative z-[1] flex max-h-[min(92dvh,880px)] w-full max-w-[min(100%,72rem)] flex-col overflow-hidden rounded-t-[1.75rem] sm:rounded-[2rem]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 justify-end border-b border-slate-100/80 px-4 py-2 dark:border-slate-800 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="ui-icon-button shrink-0 rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <KeyboardThemeEditor
                initialTheme={initialTheme}
                profileName={profileName}
                onSave={handleSave}
                onCancel={onClose}
                showCancel
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
