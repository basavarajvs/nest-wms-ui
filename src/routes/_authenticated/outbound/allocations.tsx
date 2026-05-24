import { createFileRoute } from '@tanstack/react-router'
import { Allocations } from '@/features/outbound/allocations'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/outbound/allocations')({
  component: Allocations,
})
