'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { captureClientEvent, identifyPosthogUser, initPosthog } from '@/lib/posthog/client'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    initPosthog()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    identifyPosthogUser(
      session.user.id,
      session.user.email,
      session.user.name ?? null,
    )
  }, [session?.user?.id, session?.user?.email, session?.user?.name])

  return <>{children}</>
}

export { captureClientEvent }
