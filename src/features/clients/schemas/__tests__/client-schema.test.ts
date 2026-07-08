import { describe, it, expect } from 'vitest'
import { createClientSchema } from '../client-schema'

describe('createClientSchema', () => {
  const validData = { client_code: 'CLT-001', client_name: 'Acme Corp', description: 'Test client', is_active: true }

  it('accepts valid data', () => {
    expect(createClientSchema.parse(validData)).toEqual(validData)
  })

  it('accepts only required fields', () => {
    const result = createClientSchema.parse({ client_code: 'CLT-001', client_name: 'Acme Corp' })
    expect(result.client_code).toBe('CLT-001')
    expect(result.client_name).toBe('Acme Corp')
  })

  it('applies default is_active', () => {
    expect(createClientSchema.parse({ client_code: 'CLT-001', client_name: 'Acme Corp' }).is_active).toBe(true)
  })

  it('accepts optional description as empty string', () => {
    expect(createClientSchema.parse({ client_code: 'CLT-001', client_name: 'Acme Corp', description: '' }).description).toBe('')
  })

  it('rejects empty client_code', () => {
    const result = createClientSchema.safeParse({ ...validData, client_code: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty client_name', () => {
    const result = createClientSchema.safeParse({ ...validData, client_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects client_code exceeding max length', () => {
    expect(createClientSchema.safeParse({ ...validData, client_code: 'A'.repeat(51) }).success).toBe(false)
  })

  it('rejects client_name exceeding max length', () => {
    expect(createClientSchema.safeParse({ ...validData, client_name: 'A'.repeat(201) }).success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    expect(createClientSchema.safeParse({ ...validData, description: 'A'.repeat(501) }).success).toBe(false)
  })
})
