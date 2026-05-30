import { createFileRoute } from '@tanstack/react-router'
import { Policies } from '@/features/inventory/policies'

export const Route = createFileRoute('/_authenticated/inventory/policies')({
  component: Policies,
})
