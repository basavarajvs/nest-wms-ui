import { describe, it, expect } from 'vitest'
import { createVendorSchema } from '../vendor-schema'

describe('createVendorSchema', () => {
  const validData = { vendor_code: 'VND-001', vendor_name: 'Test Vendor', description: 'Test vendor', is_active: true }

  it('accepts valid data', () => {
    expect(createVendorSchema.parse(validData)).toEqual(validData)
  })

  it('accepts only required fields', () => {
    const result = createVendorSchema.parse({ vendor_code: 'VND-001', vendor_name: 'Test Vendor' })
    expect(result.vendor_code).toBe('VND-001')
    expect(result.vendor_name).toBe('Test Vendor')
  })

  it('applies default is_active', () => {
    expect(createVendorSchema.parse({ vendor_code: 'VND-001', vendor_name: 'Test Vendor' }).is_active).toBe(true)
  })

  it('rejects empty vendor_code', () => {
    expect(createVendorSchema.safeParse({ ...validData, vendor_code: '' }).success).toBe(false)
  })

  it('rejects empty vendor_name', () => {
    expect(createVendorSchema.safeParse({ ...validData, vendor_name: '' }).success).toBe(false)
  })

  it('rejects vendor_code exceeding max length', () => {
    expect(createVendorSchema.safeParse({ ...validData, vendor_code: 'A'.repeat(51) }).success).toBe(false)
  })

  it('rejects vendor_name exceeding max length', () => {
    expect(createVendorSchema.safeParse({ ...validData, vendor_name: 'A'.repeat(201) }).success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    expect(createVendorSchema.safeParse({ ...validData, description: 'A'.repeat(501) }).success).toBe(false)
  })

  it('reports multiple field errors', () => {
    const result = createVendorSchema.safeParse({ vendor_code: '', vendor_name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('vendor_code')
      expect(paths).toContain('vendor_name')
    }
  })
})
