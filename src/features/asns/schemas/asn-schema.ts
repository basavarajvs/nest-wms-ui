import { z } from 'zod'

export const asnHeaderSchema = z.object({
  asn_number: z.string().min(1, 'ASN number is required'),
  inbound_for_client_id: z.number({ required_error: 'Client is required' }),
  vendor_id: z.number().optional().or(z.literal('')).pipe(z.coerce.number().optional()),
  po_number: z.string().optional().or(z.literal('')),
  carrier_name: z.string().optional().or(z.literal('')),
  expected_arrival_date: z.string().optional().or(z.literal('')),
  shipment_date: z.string().optional().or(z.literal('')),
  tracking_number: z.string().optional().or(z.literal('')),
  volume: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
})

export const asnLineSchema = z.object({
  product_id: z.number({ required_error: 'Product is required' }),
  expected_quantity: z.number({ required_error: 'Quantity is required' }).positive('Must be positive'),
  uom_id: z.number({ required_error: 'UOM is required' }),
  lot_number: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const createAsnSchema = z.object({
  asn_number: z.string().min(1, 'ASN number is required'),
  inbound_for_client_id: z.number({ required_error: 'Client is required' }),
  vendor_id: z.number().optional().or(z.literal('')).pipe(z.coerce.number().optional()),
  po_number: z.string().optional().or(z.literal('')),
  carrier_name: z.string().optional().or(z.literal('')),
  expected_arrival_date: z.string().optional().or(z.literal('')),
  shipment_date: z.string().optional().or(z.literal('')),
  tracking_number: z.string().optional().or(z.literal('')),
  volume: z.number().optional(),
  weight: z.number().optional(),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(asnLineSchema).min(1, 'At least one line is required'),
})

export type AsnHeaderFormValues = z.infer<typeof asnHeaderSchema>
export type AsnLineFormValues = z.infer<typeof asnLineSchema>
export type CreateAsnFormValues = z.infer<typeof createAsnSchema>
