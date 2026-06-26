import * as z from 'zod'

export const RULE_TYPE_OPTIONS = [
  { value: 'FIFO', label: 'FIFO (First In, First Out)' },
  { value: 'FEFO', label: 'FEFO (First Expiry, First Out)' },
  { value: 'LIFO', label: 'LIFO (Last In, First Out)' },
  { value: 'NEAREST_LOCATION', label: 'Nearest Location' },
  { value: 'CLIENT_PREFERRED', label: 'Client Preferred' },
] as const

export const CONSTRAINT_FIELD_OPTIONS = [
  { value: 'productId', label: 'Product' },
  { value: 'clientId', label: 'Client' },
  { value: 'zoneId', label: 'Zone' },
  { value: 'locationType', label: 'Location Type' },
] as const

export const CONSTRAINT_OPERATOR_OPTIONS = [
  { value: 'IN', label: 'In' },
  { value: 'NOT_IN', label: 'Not In' },
  { value: 'EQUALS', label: 'Equals' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' },
] as const

export const allocationRuleSchema = z.object({
  ruleName: z.string().min(1, 'Rule name is required'),
  ruleType: z.string().min(1, 'Rule type is required'),
  priority: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  effectiveDate: z.string().optional(),
  expiryDate: z.string().optional(),
  description: z.string().optional(),
})

export type AllocationRuleFormValues = z.infer<typeof allocationRuleSchema>

export const constraintSchema = z.object({
  constraintField: z.string().min(1, 'Field is required'),
  constraintOperator: z.string().min(1, 'Operator is required'),
  constraintValue: z.string().min(1, 'Value is required'),
})

export type ConstraintFormValues = z.infer<typeof constraintSchema>

export const ruleLocationSchema = z.object({
  locationId: z.string().min(1, 'Location is required'),
  priority: z.coerce.number().int().min(0).optional(),
})

export type RuleLocationFormValues = z.infer<typeof ruleLocationSchema>

export const evaluateSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  facilityId: z.string().min(1, 'Facility is required'),
  clientId: z.string().optional(),
  zoneId: z.string().optional(),
  locationId: z.string().optional(),
})

export type EvaluateFormValues = z.infer<typeof evaluateSchema>
