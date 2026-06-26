import * as z from 'zod'

const serviceCategoryEnum = z.enum(['KITTING', 'LABELING', 'PACKAGING', 'ASSEMBLY', 'INSPECTION', 'REPACK'])
const stationTypeEnum = z.enum(['KITTING', 'LABELING', 'ASSEMBLY', 'PACKING'])

export const createServiceSchema = z.object({
  serviceCode: z.string().min(1, 'Service code is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  category: serviceCategoryEnum,
  description: z.string().optional(),
  defaultRate: z.coerce.number().optional(),
  uomId: z.string().optional(),
  estimatedTimeMinutes: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
})

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>

export const updateServiceSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required').optional(),
  category: serviceCategoryEnum.optional(),
  description: z.string().optional(),
  defaultRate: z.coerce.number().optional(),
  uomId: z.string().optional(),
  estimatedTimeMinutes: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateServiceFormValues = z.infer<typeof updateServiceSchema>

export const clientRateSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  clientId: z.string().min(1, 'Client is required'),
  ratePerUnit: z.coerce.number().min(0, 'Rate must be positive'),
  currency: z.string().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  minCharge: z.coerce.number().optional(),
})

export type ClientRateFormValues = z.infer<typeof clientRateSchema>

export const createWorkstationSchema = z.object({
  workstationCode: z.string().min(1, 'Workstation code is required'),
  workstationName: z.string().min(1, 'Workstation name is required'),
  stationType: stationTypeEnum,
  facilityId: z.string().min(1, 'Facility is required'),
  locationId: z.string().optional(),
  capabilities: z.string().optional(),
})

export type CreateWorkstationFormValues = z.infer<typeof createWorkstationSchema>

export const updateWorkstationSchema = z.object({
  workstationName: z.string().min(1, 'Workstation name is required').optional(),
  locationId: z.string().optional(),
  capabilities: z.string().optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type UpdateWorkstationFormValues = z.infer<typeof updateWorkstationSchema>
