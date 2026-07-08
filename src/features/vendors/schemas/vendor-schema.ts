import { z } from 'zod'

export const createVendorSchema = z.object({
  vendor_code: z.string().min(1, 'Code is required').max(50),
  vendor_name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateVendorFormValues = z.infer<typeof createVendorSchema>
