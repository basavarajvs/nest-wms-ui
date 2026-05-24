import { createFileRoute } from '@tanstack/react-router'
import { Shipments } from '@/features/outbound/shipments'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/outbound/shipments')({
  component: Shipments,
})
