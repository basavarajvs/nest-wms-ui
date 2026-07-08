import { describe, it, expect } from 'vitest'
import { createCategorySchema } from '../category-schema'

describe('createCategorySchema', () => {
  const validData = {
    category_code: 'CAT-001',
    category_name: 'Electronics',
    description: 'Electronic components and devices',
    parent_category_id: '2',
    is_active: true,
  }

  it('accepts valid category data', () => {
    const result = createCategorySchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it('accepts data with only required fields', () => {
    const data = {
      category_code: 'CAT-002',
      category_name: 'Test Category',
    }
    const result = createCategorySchema.parse(data)
    expect(result.category_code).toBe('CAT-002')
    expect(result.category_name).toBe('Test Category')
  })

  it('applies default is_active as true', () => {
    const data = { category_code: 'CAT-003', category_name: 'Default Active' }
    const result = createCategorySchema.parse(data)
    expect(result.is_active).toBe(true)
  })

  it('rejects empty category_code', () => {
    const result = createCategorySchema.safeParse({
      ...validData,
      category_code: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'category_code')).toBe(true)
    }
  })

  it('rejects empty category_name', () => {
    const result = createCategorySchema.safeParse({
      ...validData,
      category_name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects category_code exceeding max length', () => {
    const result = createCategorySchema.safeParse({
      ...validData,
      category_code: 'A'.repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it('rejects category_name exceeding max length', () => {
    const result = createCategorySchema.safeParse({
      ...validData,
      category_name: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('rejects description exceeding max length', () => {
    const result = createCategorySchema.safeParse({
      ...validData,
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields as empty string', () => {
    const data = {
      category_code: 'CAT-004',
      category_name: 'Empty Options',
      description: '',
      parent_category_id: '',
    }
    const result = createCategorySchema.parse(data)
    expect(result.description).toBe('')
    expect(result.parent_category_id).toBe('')
  })

  it('reports multiple field errors at once', () => {
    const result = createCategorySchema.safeParse({
      category_code: '',
      category_name: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('category_code')
      expect(paths).toContain('category_name')
    }
  })
})
