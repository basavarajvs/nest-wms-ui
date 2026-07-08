import { describe, it, expect } from 'vitest'
import {
  asnHeaderSchema,
  asnLineSchema,
  createAsnSchema,
} from '../asn-schema'

describe('asnHeaderSchema', () => {
  const validHeader = {
    asn_number: 'ASN-2026-001',
    inbound_for_client_id: 1,
    vendor_id: 10,
    po_number: 'PO-001',
    carrier_name: 'FedEx',
    expected_arrival_date: '2026-07-15',
    shipment_date: '2026-07-10',
    tracking_number: '1Z999AA10123456784',
    volume: 100.5,
    weight: 50.2,
    notes: 'Urgent delivery',
  }

  it('accepts valid header data', () => {
    const result = asnHeaderSchema.parse(validHeader)
    expect(result.asn_number).toBe(validHeader.asn_number)
    expect(result.inbound_for_client_id).toBe(1)
  })

  it('accepts header with only required fields', () => {
    const data = {
      asn_number: 'ASN-2026-001',
      inbound_for_client_id: 1,
    }
    const result = asnHeaderSchema.parse(data)
    expect(result.asn_number).toBe('ASN-2026-001')
    expect(result.inbound_for_client_id).toBe(1)
  })

  it('rejects empty asn_number', () => {
    const result = asnHeaderSchema.safeParse({
      ...validHeader,
      asn_number: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'asn_number')).toBe(true)
    }
  })

  it('rejects missing inbound_for_client_id', () => {
    const { inbound_for_client_id, ...rest } = validHeader
    const result = asnHeaderSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === 'inbound_for_client_id'),
      ).toBe(true)
    }
  })

  it('accepts vendor_id as a number', () => {
    const result = asnHeaderSchema.parse({
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      vendor_id: 42,
    })
    expect(result.vendor_id).toBe(42)
  })

  it('accepts vendor_id as undefined', () => {
    const result = asnHeaderSchema.parse({
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
    })
    expect(result.vendor_id).toBeUndefined()
  })

  it('accepts optional fields as empty string', () => {
    const data = {
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      po_number: '',
      carrier_name: '',
      expected_arrival_date: '',
      shipment_date: '',
      tracking_number: '',
      notes: '',
    }
    const result = asnHeaderSchema.parse(data)
    expect(result.po_number).toBe('')
    expect(result.carrier_name).toBe('')
  })
})

describe('asnLineSchema', () => {
  const validLine = {
    product_id: 1,
    expected_quantity: 100,
    uom_id: 3,
    lot_number: 'LOT-A1',
    expiry_date: '2027-01-01',
    notes: 'Fragile items',
  }

  it('accepts valid line data', () => {
    const result = asnLineSchema.parse(validLine)
    expect(result.product_id).toBe(1)
    expect(result.expected_quantity).toBe(100)
  })

  it('accepts line with only required fields', () => {
    const data = {
      product_id: 1,
      expected_quantity: 50,
      uom_id: 2,
    }
    const result = asnLineSchema.parse(data)
    expect(result.product_id).toBe(1)
    expect(result.expected_quantity).toBe(50)
    expect(result.uom_id).toBe(2)
  })

  it('rejects missing product_id', () => {
    const { product_id, ...rest } = validLine
    const result = asnLineSchema.safeParse(rest)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'product_id')).toBe(true)
    }
  })

  it('rejects zero expected_quantity', () => {
    const result = asnLineSchema.safeParse({
      ...validLine,
      expected_quantity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative expected_quantity', () => {
    const result = asnLineSchema.safeParse({
      ...validLine,
      expected_quantity: -5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing uom_id', () => {
    const { uom_id, ...rest } = validLine
    const result = asnLineSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('accepts optional lot_number, expiry_date, notes as empty string', () => {
    const data = {
      product_id: 1,
      expected_quantity: 10,
      uom_id: 2,
      lot_number: '',
      expiry_date: '',
      notes: '',
    }
    const result = asnLineSchema.parse(data)
    expect(result.lot_number).toBe('')
    expect(result.expiry_date).toBe('')
    expect(result.notes).toBe('')
  })
})

describe('createAsnSchema', () => {
  it('accepts header with at least one line', () => {
    const data = {
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      lines: [
        { product_id: 1, expected_quantity: 10, uom_id: 2 },
      ],
    }
    const result = createAsnSchema.parse(data)
    expect(result.lines).toHaveLength(1)
  })

  it('rejects empty lines array', () => {
    const result = createAsnSchema.safeParse({
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      lines: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'lines')).toBe(true)
    }
  })

  it('rejects missing lines field', () => {
    const result = createAsnSchema.safeParse({
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
    })
    expect(result.success).toBe(false)
  })

  it('validates each line in the array', () => {
    const result = createAsnSchema.safeParse({
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      lines: [
        { product_id: 1, expected_quantity: 0, uom_id: 2 },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts multiple lines', () => {
    const data = {
      asn_number: 'ASN-001',
      inbound_for_client_id: 1,
      lines: [
        { product_id: 1, expected_quantity: 10, uom_id: 2 },
        { product_id: 3, expected_quantity: 5, uom_id: 4 },
      ],
    }
    const result = createAsnSchema.parse(data)
    expect(result.lines).toHaveLength(2)
  })
})
