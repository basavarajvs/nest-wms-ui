import { describe, it, expect } from 'vitest'
import { createFacilitySchema } from '../facility-schema'

describe('createFacilitySchema', () => {
  const validData = {
    facility_code: 'WH-MAIN',
    facility_name: 'Main Warehouse',
    facility_type: 'WAREHOUSE',
    description: 'Primary storage facility',
    address_line1: '123 Industrial Blvd',
    address_line2: 'Suite 100',
    city: 'Atlanta',
    state_province: 'GA',
    postal_code: '30301',
    country_code: 'US',
    contact_person: 'John Smith',
    contact_phone: '+1-555-0123',
    contact_email: 'john@example.com',
    timezone_name: 'America/New_York',
    is_active: true,
  }

  it('accepts valid facility data', () => {
    const result = createFacilitySchema.parse(validData)
    expect(result.facility_code).toBe('WH-MAIN')
    expect(result.facility_name).toBe('Main Warehouse')
  })

  it('accepts data with only required fields', () => {
    const data = {
      facility_code: 'WH-002',
      facility_name: 'Secondary Warehouse',
    }
    const result = createFacilitySchema.parse(data)
    expect(result.facility_code).toBe('WH-002')
    expect(result.facility_name).toBe('Secondary Warehouse')
  })

  it('applies default is_active as true', () => {
    const data = {
      facility_code: 'WH-003',
      facility_name: 'Tertiary Warehouse',
    }
    const result = createFacilitySchema.parse(data)
    expect(result.is_active).toBe(true)
  })

  it('rejects empty facility_code', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      facility_code: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'facility_code')).toBe(true)
    }
  })

  it('rejects facility_code exceeding max length', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      facility_code: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty facility_name', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      facility_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects facility_name exceeding max length', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      facility_name: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid contact_email format', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      contact_email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('accepts contact_email as empty string', () => {
    const data = {
      facility_code: 'WH-004',
      facility_name: 'Test WH',
      contact_email: '',
    }
    const result = createFacilitySchema.parse(data)
    expect(result.contact_email).toBe('')
  })

  it('rejects fields exceeding max length', () => {
    const result = createFacilitySchema.safeParse({
      ...validData,
      description: 'A'.repeat(501),
      address_line1: 'A'.repeat(201),
      city: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('accepts all optional fields as empty string', () => {
    const data = {
      facility_code: 'WH-005',
      facility_name: 'Minimal WH',
      facility_type: '',
      description: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      country_code: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      timezone_name: '',
    }
    const result = createFacilitySchema.parse(data)
    expect(result.facility_type).toBe('')
    expect(result.description).toBe('')
    expect(result.address_line1).toBe('')
    expect(result.city).toBe('')
  })
})
