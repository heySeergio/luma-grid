import { runStripeWebhookPOST } from '@/lib/stripe/webhook-request'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const POST = runStripeWebhookPOST
