import { createFileRoute } from '@tanstack/react-router'
import { AllocationRules } from '@/features/inventory/allocation-rules'

export const Route = createFileRoute('/_authenticated/inventory/allocation-rules')({
  component: AllocationRules,
})
