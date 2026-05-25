'use client'

import { useEffect, useRef } from 'react'
import { captureClientEvent } from '@/lib/posthog/client'

type Props = {
  profileId: string | null | undefined
}

export function BoardOpenedTracker({ profileId }: Props) {
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (!profileId || last.current === profileId) return
    last.current = profileId
    captureClientEvent('board_opened', { profile_id: profileId })
  }, [profileId])

  return null
}
