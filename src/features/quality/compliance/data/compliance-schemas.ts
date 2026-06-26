import * as z from 'zod'

export const createRequirementSchema = z.object({
  complianceType: z.enum(['FDA', 'OSHA', 'ISO', 'CUSTOM']),
  requirementCode: z.string().min(1, 'Code is required'),
  description: z.string().min(1, 'Description is required'),
  applicableEntity: z.enum(['PRODUCT', 'LOCATION', 'FACILITY', 'PROCESS']).optional(),
  frequencyType: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
})

export const createAuditSchema = z.object({
  requirementId: z.string().min(1, 'Requirement is required'),
  auditedByUserId: z.string().optional(),
  scheduledDate: z.string().optional(),
})

export const updateAuditSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'CONDITIONAL']).optional(),
  result: z.enum(['PASS', 'FAIL', 'CONDITIONAL']).optional(),
  findings: z.any().optional(),
  correctiveActions: z.any().optional(),
})
