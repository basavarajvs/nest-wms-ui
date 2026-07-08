import { describe, it, expect } from 'vitest'
import { createProductSchema } from '../product-schema'

describe('createProductSchema', () => {
  const validData = {
    product_code: 'PROD-001',
    product_name: 'Test Product',
    description: 'A test product description',
    brand_id: '1',
    category_id: '2',
    primary_uom_id: '3',
    is_active: true,
  }

  it('accepts valid product data', () => {
    const result = createProductSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it('accepts data with only required fields', () => {
    const data = {
      product_code: 'PROD-001',
      product_name: 'Test Product',
    }
    const result = createProductSchema.parse(data)
    expect(result.product_code).toBe('PROD-001')
    expect(result.product_name).toBe('Test Product')
  })

  it('applies default is_active as true', () => {
    const data = {
      product_code: 'PROD-001',
      product_name: 'Test Product',
    }
    const result = createProductSchema.parse(data)
    expect(result.is_active).toBe(true)
  })

  it('accepts optional fields as empty string', () => {
    const data = {
      product_code: 'PROD-001',
      product_name: 'Test Product',
      description: '',
      brand_id: '',
      category_id: '',
      primary_uom_id: '',
    }
    const result = createProductSchema.parse(data)
    expect(result.description).toBe('')
    expect(result.brand_id).toBe('')
    expect(result.category_id).toBe('')
    expect(result.primary_uom_id).toBe('')
  })

  it('rejects empty product_code', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      product_code: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'product_code')).toBe(true)
    }
  })

  it('rejects missing product_code', () => {
    const { product_code, ...withoutCode } = validData
    const result = createProductSchema.safeParse(withoutCode)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'product_code')).toBe(true)
    }
  })

  it('rejects empty product_name', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      product_name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'product_name')).toBe(true)
    }
  })

  it('rejects product_code exceeding max length', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      product_code: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects product_name exceeding max length', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      product_name: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean is_active', () => {
    const result = createProductSchema.safeParse({
      ...validData,
      is_active: 'yes',
    })
    expect(result.success).toBe(false)
  })

  it('infers correct type', () => {
    const result = createProductSchema.parse(validData)
    expect(typeof result.product_code).toBe('string')
    expect(typeof result.product_name).toBe('string')
    expect(typeof result.is_active).toBe('boolean')
  })
})
