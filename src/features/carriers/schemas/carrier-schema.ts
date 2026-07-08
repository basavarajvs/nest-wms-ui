import { z } from 'zod'

export const createCarrierSchema = z.object({
  carrier_code: z.string().min(1, 'Code is required').max(50),
  carrier_name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateCarrierFormValues = z.infer<typeof createCarrierSchema>
