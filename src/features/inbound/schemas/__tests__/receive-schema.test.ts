import { describe, it, expect } from 'vitest'
import { receiveLineSchema, receiveFormSchema } from '../receive-schema'

describe('receiveLineSchema', () => {
  const validLine = {
    asn_line_id: 1,
    product_id: 10,
    uom_id: 3,
    expected_quantity: 100,
    received_quantity: 95,
    staging_location_id: 5,
    lot_number: 'LOT-B2',
    expiry_date: '2026-12-31',
    notes: 'Partial delivery',
  }

  it('accepts valid receive line', () => {
    const result = receiveLineSchema.parse(validLine)
    expect(result.asn_line_id).toBe(1)
    expect(result.received_quantity).toBe(95)
  })

  it('accepts minimum received_quantity', () => {
    const data = { ...validLine, received_quantity: 0.001 }
    const result = receiveLineSchema.parse(data)
    expect(result.received_quantity).toBe(0.001)
  })

  it('rejects missing asn_line_id', () => {
    const { asn_line_id, ...rest } = validLine
    const result = receiveLineSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'asn_line_id')).toBe(true)
    }
  })

  it('rejects missing product_id', () => {
    const { product_id, ...rest } = validLine
    const result = receiveLineSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects received_quantity of 0', () => {
    const result = receiveLineSchema.safeParse({
      ...validLine,
      received_quantity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative received_quantity', () => {
    const result = receiveLineSchema.safeParse({
      ...validLine,
      received_quantity: -1,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing staging_location_id', () => {
    const { staging_location_id, ...rest } = validLine
    const result = receiveLineSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects staging_location_id of 0', () => {
    const result = receiveLineSchema.safeParse({
      ...validLine,
      staging_location_id: 0,
    })
    expect(result.success).toBe(false)
  })

  it('coerces received_quantity from string', () => {
    const result = receiveLineSchema.parse({
      ...validLine,
      received_quantity: '50',
    })
    expect(result.received_quantity).toBe(50)
  })

  it('coerces staging_location_id from string', () => {
    const result = receiveLineSchema.parse({
      ...validLine,
      staging_location_id: '7',
    })
    expect(result.staging_location_id).toBe(7)
  })

  it('accepts expected_quantity of 0', () => {
    const data = { ...validLine, expected_quantity: 0 }
    const result = receiveLineSchema.parse(data)
    expect(result.expected_quantity).toBe(0)
  })
})

describe('receiveFormSchema', () => {
  it('accepts valid form with lines', () => {
    const data = {
      asn_id: 42,
      asn_number: 'ASN-2026-001',
      lines: [
        {
          asn_line_id: 1,
          product_id: 10,
          uom_id: 3,
          expected_quantity: 100,
          received_quantity: 95,
          staging_location_id: 5,
          lot_number: '',
          expiry_date: '',
          notes: '',
        },
      ],
    }
    const result = receiveFormSchema.parse(data)
    expect(result.asn_id).toBe(42)
    expect(result.lines).toHaveLength(1)
  })

  it('rejects empty lines', () => {
    const result = receiveFormSchema.safeParse({
      asn_id: 42,
      asn_number: 'ASN-001',
      lines: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'lines')).toBe(true)
    }
  })

  it('rejects missing asn_number', () => {
    const result = receiveFormSchema.safeParse({
      asn_id: 42,
      lines: [
        {
          asn_line_id: 1,
          product_id: 10,
          uom_id: 3,
          expected_quantity: 100,
          received_quantity: 95,
          staging_location_id: 5,
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
