import { createFileRoute } from '@tanstack/react-router'
import { Adjustments } from '@/features/inventory/adjustments'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/adjustments')({
  component: Adjustments,
})
