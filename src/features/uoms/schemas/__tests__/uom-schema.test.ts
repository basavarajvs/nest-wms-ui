import { describe, it, expect } from 'vitest'
import { createUomSchema } from '../uom-schema'

describe('createUomSchema', () => {
  const validData = { uom_code: 'EA', uom_name: 'Each', description: 'Individual unit', is_active: true }

  it('accepts valid data', () => {
    expect(createUomSchema.parse(validData)).toEqual(validData)
  })

  it('accepts only required fields', () => {
    const result = createUomSchema.parse({ uom_code: 'CS', uom_name: 'Case' })
    expect(result.uom_code).toBe('CS')
    expect(result.uom_name).toBe('Case')
  })

  it('applies default is_active', () => {
    expect(createUomSchema.parse({ uom_code: 'PL', uom_name: 'Pallet' }).is_active).toBe(true)
  })

  it('rejects empty uom_code', () => {
    expect(createUomSchema.safeParse({ ...validData, uom_code: '' }).success).toBe(false)
  })

  it('rejects empty uom_name', () => {
    expect(createUomSchema.safeParse({ ...validData, uom_name: '' }).success).toBe(false)
  })

  it('rejects uom_code exceeding max length', () => {
    expect(createUomSchema.safeParse({ ...validData, uom_code: 'A'.repeat(51) }).success).toBe(false)
  })

  it('rejects uom_name exceeding max length', () => {
    expect(createUomSchema.safeParse({ ...validData, uom_name: 'A'.repeat(201) }).success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    expect(createUomSchema.safeParse({ ...validData, description: 'A'.repeat(501) }).success).toBe(false)
  })

  it('reports multiple field errors', () => {
    const result = createUomSchema.safeParse({ uom_code: '', uom_name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('uom_code')
      expect(paths).toContain('uom_name')
    }
  })
})
