import { describe, it, expect } from 'vitest'
import { createBrandSchema } from '../brand-schema'

describe('createBrandSchema', () => {
  const validData = {
    brand_code: 'BRD-001',
    brand_name: 'Test Brand',
    description: 'A test brand',
    is_active: true,
  }

  it('accepts valid brand data', () => {
    const result = createBrandSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it('accepts data with only required fields', () => {
    const data = { brand_code: 'BRD-001', brand_name: 'Test Brand' }
    const result = createBrandSchema.parse(data)
    expect(result.brand_code).toBe('BRD-001')
    expect(result.brand_name).toBe('Test Brand')
  })

  it('applies default is_active as true', () => {
    const data = { brand_code: 'BRD-001', brand_name: 'Test Brand' }
    const result = createBrandSchema.parse(data)
    expect(result.is_active).toBe(true)
  })

  it('accepts description as empty string', () => {
    const data = {
      brand_code: 'BRD-001',
      brand_name: 'Test Brand',
      description: '',
    }
    const result = createBrandSchema.parse(data)
    expect(result.description).toBe('')
  })

  it('rejects empty brand_code', () => {
    const result = createBrandSchema.safeParse({ ...validData, brand_code: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'brand_code')).toBe(true)
    }
  })

  it('rejects missing brand_code', () => {
    const { brand_code, ...rest } = validData
    const result = createBrandSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty brand_name', () => {
    const result = createBrandSchema.safeParse({ ...validData, brand_name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'brand_name')).toBe(true)
    }
  })

  it('rejects brand_code exceeding max length', () => {
    const result = createBrandSchema.safeParse({
      ...validData,
      brand_code: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects brand_name exceeding max length', () => {
    const result = createBrandSchema.safeParse({
      ...validData,
      brand_name: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    const result = createBrandSchema.safeParse({
      ...validData,
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('reports multiple field errors at once', () => {
    const result = createBrandSchema.safeParse({
      brand_code: '',
      brand_name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('brand_code')
      expect(paths).toContain('brand_name')
    }
  })
})
