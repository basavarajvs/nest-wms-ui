import { z } from 'zod'

export const createCategorySchema = z.object({
  category_code: z.string().min(1, 'Code is required').max(50, 'Code must be at most 50 characters'),
  category_name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
  description: z.string().max(500).optional().or(z.literal('')),
  parent_category_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>
