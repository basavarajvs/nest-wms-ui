import { createFileRoute } from '@tanstack/react-router'
import { Policies } from '@/features/inventory/policies'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/policies')({
  component: Policies,
})
