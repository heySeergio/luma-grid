import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateTotpSecret, getTotpUri, verifyTotpCode } from './twoFactor'
import * as OTPAuth from 'otpauth'

describe('twoFactor TOTP', () => {
  it('generates valid otpauth URI', () => {
    const secret = generateTotpSecret()
    const uri = getTotpUri('user@example.com', secret)
    assert.ok(uri.startsWith('otpauth://totp/'))
  })

  it('verifies a valid TOTP code', () => {
    const secret = generateTotpSecret()
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    })
    const token = totp.generate()
    assert.equal(verifyTotpCode(secret, token), true)
  })

  it('rejects invalid code', () => {
    const secret = generateTotpSecret()
    assert.equal(verifyTotpCode(secret, '000000'), false)
  })
})
