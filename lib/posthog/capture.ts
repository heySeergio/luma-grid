const FEEDBACK_TYPES = new Set(['bug', 'suggestion', 'general'])

export function parseFeedbackType(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim().toLowerCase()
  return FEEDBACK_TYPES.has(t) ? t : null
}

export function parseFeedbackRating(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return null
  if (raw < 1 || raw > 5) return null
  return raw
}

/** Captura evento en PostHog (servidor o cliente). No lanza si falta config. */
export async function captureProductEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const apiKey =
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    process.env.POSTHOG_PROJECT_API_KEY?.trim()
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST || 'https://app.posthog.com')
    .replace(/\/$/, '')

  if (!apiKey || !distinctId) return

  try {
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: properties ?? {},
      }),
    })
  } catch (e) {
    console.error('[posthog] capture', event, e)
  }
}
