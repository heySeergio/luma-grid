import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'
import {
  canUseFullEvaluation,
  effectiveSubscriptionPlan,
  getMaxProfiles,
  FREE_MAX_TOTAL_SYMBOLS,
  normalizeSubscriptionPlan,
} from './plans'

describe('subscription plans', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env, SUBSCRIPTION_ENFORCEMENT: 'true' }
  })

  afterEach(() => {
    process.env = env
  })

  it('normalizes Spanish and legacy plan codes', () => {
    assert.equal(normalizeSubscriptionPlan('libre'), 'free')
    assert.equal(normalizeSubscriptionPlan('voz'), 'voice')
    assert.equal(normalizeSubscriptionPlan('identidad'), 'identity')
    assert.equal(normalizeSubscriptionPlan('terapeuta'), 'therapist')
    assert.equal(normalizeSubscriptionPlan('pro'), 'identity')
  })

  it('applies profile limits per plan when enforcement is on', () => {
    assert.equal(getMaxProfiles('free'), 3)
    assert.equal(getMaxProfiles('voice'), 5)
    assert.equal(getMaxProfiles('identity'), 20)
    assert.equal(getMaxProfiles('therapist'), 20)
  })

  it('gates full evaluation to paid voice+ plans', () => {
    assert.equal(canUseFullEvaluation('free'), false)
    assert.equal(canUseFullEvaluation('voice'), true)
    assert.equal(canUseFullEvaluation('identity'), true)
    assert.equal(canUseFullEvaluation('therapist'), true)
  })

  it('uses identity bypass when enforcement is off', () => {
    process.env.SUBSCRIPTION_ENFORCEMENT = 'false'
    assert.equal(effectiveSubscriptionPlan('test@example.com', 'libre'), 'identity')
    assert.equal(FREE_MAX_TOTAL_SYMBOLS, 150)
  })
})
