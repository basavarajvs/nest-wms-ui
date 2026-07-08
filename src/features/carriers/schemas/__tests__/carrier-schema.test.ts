import { describe, it, expect } from 'vitest'
import { createCarrierSchema } from '../carrier-schema'

describe('createCarrierSchema', () => {
  const validData = { carrier_code: 'CAR-001', carrier_name: 'FedEx', description: 'Express carrier', is_active: true }

  it('accepts valid data', () => {
    expect(createCarrierSchema.parse(validData)).toEqual(validData)
  })

  it('accepts only required fields', () => {
    const result = createCarrierSchema.parse({ carrier_code: 'CAR-001', carrier_name: 'FedEx' })
    expect(result.carrier_code).toBe('CAR-001')
    expect(result.carrier_name).toBe('FedEx')
  })

  it('applies default is_active', () => {
    expect(createCarrierSchema.parse({ carrier_code: 'CAR-001', carrier_name: 'FedEx' }).is_active).toBe(true)
  })

  it('rejects empty carrier_code', () => {
    expect(createCarrierSchema.safeParse({ ...validData, carrier_code: '' }).success).toBe(false)
  })

  it('rejects empty carrier_name', () => {
    expect(createCarrierSchema.safeParse({ ...validData, carrier_name: '' }).success).toBe(false)
  })

  it('rejects carrier_code exceeding max length', () => {
    expect(createCarrierSchema.safeParse({ ...validData, carrier_code: 'A'.repeat(51) }).success).toBe(false)
  })

  it('rejects carrier_name exceeding max length', () => {
    expect(createCarrierSchema.safeParse({ ...validData, carrier_name: 'A'.repeat(201) }).success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    expect(createCarrierSchema.safeParse({ ...validData, description: 'A'.repeat(501) }).success).toBe(false)
  })
})
