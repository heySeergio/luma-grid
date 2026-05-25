import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe/server'
import { pingPosthog } from '@/lib/intranet/posthog'

export type HealthStatus = 'ok' | 'error' | 'degraded'

export type HealthCheckResult = {
  service: string
  status: HealthStatus
  durationMs: number
  message?: string
  checkedAt: string
}

async function timedCheck(
  service: string,
  fn: () => Promise<void>,
  timeoutMs = 5000,
): Promise<HealthCheckResult> {
  const started = Date.now()
  const checkedAt = new Date().toISOString()
  try {
    await Promise.race([
      fn(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), timeoutMs),
      ),
    ])
    return { service, status: 'ok', durationMs: Date.now() - started, checkedAt }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    const status: HealthStatus = msg === 'timeout' ? 'degraded' : 'error'
    return {
      service,
      status,
      durationMs: Date.now() - started,
      message: msg,
      checkedAt,
    }
  }
}

export async function runHealthChecks(): Promise<HealthCheckResult[]> {
  const checks = [
    timedCheck('Neon DB', async () => {
      await prisma.$queryRaw`SELECT 1`
    }),
    timedCheck('Stripe', async () => {
      if (!process.env.STRIPE_SECRET_KEY?.trim()) throw new Error('no configurado')
      const stripe = getStripe()
      await stripe.balance.retrieve()
    }),
    timedCheck('ElevenLabs', async () => {
      const key = process.env.ELEVENLABS_API_KEY?.trim()
      if (!key) throw new Error('no configurado')
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': key },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),
    timedCheck('Anthropic', async () => {
      const key = process.env.ANTHROPIC_API_KEY?.trim()
      if (!key) throw new Error('no configurado')
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    }),
  ]

  if (process.env.POSTHOG_API_KEY?.trim()) {
    checks.push(
      timedCheck('PostHog', async () => {
        const ok = await pingPosthog()
        if (!ok) throw new Error('ping falló')
      }),
    )
  }

  return Promise.all(checks)
}
