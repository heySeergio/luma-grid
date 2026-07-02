import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dbPlanFromCheckoutTier, resolveDbPlanFromPriceId } from './plan-mapping'
import { normalizeSubscriptionPlan } from '../subscription/plans'

describe('stripe plan mapping', () => {
  it('maps checkout tiers to DB plan codes', () => {
    assert.equal(dbPlanFromCheckoutTier('voice'), 'voz')
    assert.equal(dbPlanFromCheckoutTier('identity'), 'identidad')
    assert.equal(dbPlanFromCheckoutTier('therapist'), 'terapeuta')
  })

  it('resolves configured price IDs from env', () => {
    const prev = process.env.STRIPE_PRICE_VOZ_MONTHLY
    process.env.STRIPE_PRICE_VOZ_MONTHLY = 'price_test_voz_m'
    assert.equal(resolveDbPlanFromPriceId('price_test_voz_m'), 'voz')
    process.env.STRIPE_PRICE_VOZ_MONTHLY = prev
  })

  it('keeps therapist in subscription plan normalization', () => {
    assert.equal(normalizeSubscriptionPlan('terapeuta'), 'therapist')
  })
})
