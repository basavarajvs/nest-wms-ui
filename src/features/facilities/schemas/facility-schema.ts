import { z } from 'zod'

export const createFacilitySchema = z.object({
  facility_code: z.string().min(1, 'Code is required').max(50),
  facility_name: z.string().min(1, 'Name is required').max(200),
  facility_type: z.string().optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  address_line1: z.string().max(200).optional().or(z.literal('')),
  address_line2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state_province: z.string().max(100).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country_code: z.string().max(10).optional().or(z.literal('')),
  contact_person: z.string().max(200).optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
  timezone_name: z.string().optional().or(z.literal('')),
  is_active: z.boolean().optional().default(true),
})

export type CreateFacilityFormValues = z.infer<typeof createFacilitySchema>
