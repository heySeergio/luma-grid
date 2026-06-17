import assert from 'node:assert/strict'
import { describe, it, beforeEach, afterEach } from 'node:test'

describe('getAuthSecret', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.NEXTAUTH_SECRET
  })

  afterEach(() => {
    process.env = env
  })

  it('devuelve NEXTAUTH_SECRET cuando está definido', async () => {
    process.env.NEXTAUTH_SECRET = 'prod-secret'
    const { getAuthSecret } = await import('./secret')
    assert.equal(getAuthSecret(), 'prod-secret')
  })

  it('permite build de producción sin secret', async () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PHASE = 'phase-production-build'
    const { getAuthSecret } = await import('./secret')
    assert.ok(getAuthSecret())
  })

  it('falla en runtime de producción sin secret', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.NEXT_PHASE
    const { getAuthSecret } = await import('./secret')
    assert.throws(() => getAuthSecret(), /NEXTAUTH_SECRET es obligatorio/)
  })
})
