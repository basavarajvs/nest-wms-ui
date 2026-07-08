import { z } from 'zod'

export const receiveLineSchema = z.object({
  asn_line_id: z.number({ required_error: 'Line is required' }),
  product_id: z.number({ required_error: 'Product is required' }),
  uom_id: z.number({ required_error: 'UOM is required' }),
  expected_quantity: z.number().min(0),
  received_quantity: z.coerce.number({ required_error: 'Received qty is required' }).min(0.001, 'Must be > 0'),
  staging_location_id: z.coerce.number({ required_error: 'Location is required' }).min(1, 'Location is required'),
  lot_number: z.string().optional().or(z.literal('')),
  expiry_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const receiveFormSchema = z.object({
  asn_id: z.number({ required_error: 'ASN is required' }),
  asn_number: z.string().min(1, 'ASN number is required'),
  lines: z.array(receiveLineSchema).min(1, 'At least one line is required'),
})

export type ReceiveLineFormValues = z.infer<typeof receiveLineSchema>
export type ReceiveFormValues = z.infer<typeof receiveFormSchema>
