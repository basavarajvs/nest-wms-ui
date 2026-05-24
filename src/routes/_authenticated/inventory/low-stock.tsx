import { createFileRoute } from '@tanstack/react-router'
import { LowStock } from '@/features/inventory/low-stock'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/low-stock')({
  component: LowStock,
})
