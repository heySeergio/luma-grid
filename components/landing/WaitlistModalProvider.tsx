'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

import { WaitlistModal } from '@/components/landing/WaitlistModal'

type WaitlistModalContextValue = {
  openWaitlist: () => void
  waitlistOpen: boolean
}

const WaitlistModalContext = createContext<WaitlistModalContextValue | null>(null)

export function useWaitlistModal() {
  const ctx = useContext(WaitlistModalContext)
  if (!ctx) {
    throw new Error('useWaitlistModal debe usarse dentro de WaitlistModalProvider')
  }
  return ctx
}

type WaitlistModalProviderProps = {
  children: ReactNode
  comingSoon: boolean
}

export function WaitlistModalProvider({
  children,
  comingSoon,
}: WaitlistModalProviderProps) {
  const [open, setOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  const openWaitlist = useCallback(() => {
    setModalKey((k) => k + 1)
    setOpen(true)
  }, [])

  return (
    <WaitlistModalContext.Provider value={{ openWaitlist, waitlistOpen: open }}>
      {children}
      {comingSoon ? (
        <WaitlistModal key={modalKey} open={open} onClose={() => setOpen(false)} />
      ) : null}
    </WaitlistModalContext.Provider>
  )
}
