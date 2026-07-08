import { z } from 'zod'

export const createUomSchema = z.object({
  uom_code: z.string().min(1, 'Code is required').max(50),
  uom_name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateUomFormValues = z.infer<typeof createUomSchema>
