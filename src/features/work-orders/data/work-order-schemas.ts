import * as z from 'zod'

export const createWorkOrderSchema = z.object({
  workOrderType: z.enum(['ASSEMBLY', 'DISASSEMBLY', 'KITTING', 'REPAIR', 'CUSTOM']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  productId: z.string().optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  uomId: z.string().optional(),
  clientId: z.string().optional(),
  assignedToUserId: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateWorkOrderFormValues = z.infer<typeof createWorkOrderSchema>

export const operationSchema = z.object({
  sequenceNumber: z.coerce.number().int().min(1, 'Required'),
  operationName: z.string().min(1, 'Required'),
  operationType: z.enum(['TASK', 'QUALITY_CHECK', 'MOVE', 'LABEL']),
  assignedToUserId: z.string().optional(),
  estimatedMinutes: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
})

export type OperationFormValues = z.infer<typeof operationSchema>

export const componentSchema = z.object({
  productId: z.string().min(1, 'Required'),
  lotId: z.string().optional(),
  quantityRequired: z.coerce.number().min(0, 'Required'),
  uomId: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

export type ComponentFormValues = z.infer<typeof componentSchema>
