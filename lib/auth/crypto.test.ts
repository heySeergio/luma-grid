import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { encryptSecret, decryptSecret, hashToken, generateSecureToken } from './crypto'

describe('auth crypto', () => {
  it('encrypts and decrypts roundtrip', () => {
    const plain = 'JBSWY3DPEHPK3PXP'
    const enc = encryptSecret(plain)
    assert.notEqual(enc, plain)
    assert.equal(decryptSecret(enc), plain)
  })

  it('hashes tokens deterministically', () => {
    const a = hashToken('test-token')
    const b = hashToken('test-token')
    assert.equal(a, b)
    assert.notEqual(a, hashToken('other'))
  })

  it('generates unique secure tokens', () => {
    const a = generateSecureToken()
    const b = generateSecureToken()
    assert.notEqual(a, b)
    assert.ok(a.length > 20)
  })
})
