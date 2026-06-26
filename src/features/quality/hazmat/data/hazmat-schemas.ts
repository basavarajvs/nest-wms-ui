import * as z from 'zod'

export const createHazmatSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  hazardClass: z.string().min(1, 'Hazard class is required'),
  unNumber: z.string().min(1, 'UN number is required'),
  properShippingName: z.string().min(1, 'Shipping name is required'),
  packingGroup: z.string().optional(),
  division: z.string().optional(),
  flashPoint: z.string().optional(),
  storageGroup: z.string().optional(),
  msdsUrl: z.string().url().optional().or(z.literal('')),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
})
