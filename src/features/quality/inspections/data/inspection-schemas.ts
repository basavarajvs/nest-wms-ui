import * as z from 'zod'

export const createInspectionSchema = z.object({
  inspectionType: z.enum(['RECEIVING', 'PICKING', 'RETURN', 'ROUTINE', 'COMPLIANCE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  productId: z.string().optional(),
  lotId: z.string().optional(),
  locationId: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  assignedToUserId: z.string().optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateInspectionFormValues = z.infer<typeof createInspectionSchema>

export const updateInspectionSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedToUserId: z.string().optional(),
  notes: z.string().optional(),
})

export type UpdateInspectionFormValues = z.infer<typeof updateInspectionSchema>

export const createInspectionResultSchema = z.object({
  checkType: z.enum(['VISUAL', 'DIMENSIONAL', 'WEIGHT', 'COUNT', 'LABEL', 'DOCUMENT', 'TEST']),
  result: z.enum(['PASS', 'FAIL', 'N/A']),
  measuredValue: z.coerce.number().optional(),
  toleranceMin: z.coerce.number().optional(),
  toleranceMax: z.coerce.number().optional(),
  notes: z.string().optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
})
