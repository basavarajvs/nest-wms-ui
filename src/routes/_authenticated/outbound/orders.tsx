import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/outbound/orders'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/outbound/orders')({
  component: Orders,
})
