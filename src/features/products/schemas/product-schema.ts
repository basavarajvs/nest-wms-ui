import { z } from 'zod'

export const createProductSchema = z.object({
  product_code: z
    .string()
    .min(1, 'Product code is required')
    .max(50, 'Product code must be at most 50 characters'),
  product_name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be at most 200 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  brand_id: z.string().optional().or(z.literal('')),
  category_id: z.string().optional().or(z.literal('')),
  primary_uom_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateProductFormValues = z.infer<typeof createProductSchema>
