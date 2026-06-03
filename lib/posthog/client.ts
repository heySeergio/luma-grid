'use client'

import posthog from 'posthog-js'

let initialized = false

export function initPosthog(): void {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()
  if (!key) return

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://app.posthog.com'
  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    persistence: 'localStorage+cookie',
  })
  initialized = true
}

export function identifyPosthogUser(userId: string, email?: string | null, name?: string | null) {
  if (!initialized) return
  posthog.identify(userId, {
    email: email ?? undefined,
    name: name ?? undefined,
  })
}

export function captureClientEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  posthog.capture(event, properties)
}
