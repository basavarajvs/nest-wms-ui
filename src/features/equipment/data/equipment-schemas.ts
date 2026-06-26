import * as z from 'zod'

export const createEquipmentSchema = z.object({
  equipmentCode: z.string().min(1, 'Required'),
  equipmentName: z.string().min(1, 'Required'),
  equipmentType: z.enum(['FORKLIFT', 'PALLET_JACK', 'HAND_TRUCK', 'CONVEYOR', 'SCANNER', 'PRINTER']),
  locationId: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  notes: z.string().optional(),
})

export type CreateEquipmentFormValues = z.infer<typeof createEquipmentSchema>

export const updateEquipmentSchema = z.object({
  equipmentName: z.string().min(1, 'Required'),
  locationId: z.string().optional(),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  notes: z.string().optional(),
})

export type UpdateEquipmentFormValues = z.infer<typeof updateEquipmentSchema>

export const changeStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED']),
  notes: z.string().optional(),
})

export type ChangeStatusFormValues = z.infer<typeof changeStatusSchema>

export const createMaintenanceSchema = z.object({
  maintenanceType: z.enum(['PREVENTIVE', 'REPAIR', 'INSPECTION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  downtimeMinutes: z.coerce.number().int().min(0).optional(),
  performedByUserId: z.string().optional(),
})

export type CreateMaintenanceFormValues = z.infer<typeof createMaintenanceSchema>

export const completeMaintenanceSchema = z.object({
  cost: z.coerce.number().min(0).optional(),
  downtimeMinutes: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  performedByUserId: z.string().optional(),
})

export type CompleteMaintenanceFormValues = z.infer<typeof completeMaintenanceSchema>
