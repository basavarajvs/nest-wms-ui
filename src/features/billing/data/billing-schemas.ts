import * as z from 'zod'

const rateTypeEnum = z.enum(['PER_PALLET', 'PER_SQFT', 'PER_CUBIC_FOOT', 'FLAT'])
const calcBasisEnum = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'])
const cycleFreqEnum = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY'])
const invoiceStatusEnum = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])

export const createRateSchema = z.object({
  rateCode: z.string().min(1, 'Rate code is required'),
  rateName: z.string().min(1, 'Rate name is required'),
  rateType: rateTypeEnum,
  calculationBasis: calcBasisEnum,
  defaultRate: z.coerce.number().min(0, 'Rate must be positive'),
  currency: z.string().optional(),
  minCharge: z.coerce.number().optional(),
  maxCharge: z.coerce.number().optional(),
  facilityId: z.string().min(1, 'Facility is required'),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional(),
})

export type CreateRateFormValues = z.infer<typeof createRateSchema>

export const clientRateSchema = z.object({
  rateMasterId: z.string().min(1, 'Rate master is required'),
  clientId: z.string().min(1, 'Client is required'),
  negotiatedRate: z.coerce.number().min(0, 'Rate must be positive'),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
})

export type ClientRateFormValues = z.infer<typeof clientRateSchema>

export const createCycleSchema = z.object({
  cycleCode: z.string().min(1, 'Cycle code is required'),
  cycleName: z.string().min(1, 'Cycle name is required'),
  facilityId: z.string().min(1, 'Facility is required'),
  frequency: cycleFreqEnum,
  billingDay: z.coerce.number().min(1, 'Day 1-31').max(31, 'Day 1-31'),
})

export type CreateCycleFormValues = z.infer<typeof createCycleSchema>

export const generateSnapshotSchema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  clientId: z.string().min(1, 'Client is required'),
  snapshotDate: z.string().min(1, 'Snapshot date is required'),
})

export type GenerateSnapshotFormValues = z.infer<typeof generateSnapshotSchema>

export const calculateChargesSchema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  cycleId: z.string().optional(),
  clientId: z.string().optional(),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
})

export type CalculateChargesFormValues = z.infer<typeof calculateChargesSchema>

export const generateInvoiceSchema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  clientId: z.string().min(1, 'Client is required'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  taxAmount: z.coerce.number().optional(),
  discountAmount: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export type GenerateInvoiceFormValues = z.infer<typeof generateInvoiceSchema>

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusEnum,
  paidAt: z.string().optional(),
  notes: z.string().optional(),
})

export type UpdateInvoiceStatusFormValues = z.infer<typeof updateInvoiceStatusSchema>
