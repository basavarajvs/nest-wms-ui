import { createFileRoute } from '@tanstack/react-router'
import { LowStock } from '@/features/inventory/low-stock'

export const Route = createFileRoute('/_authenticated/inventory/low-stock')({
  component: LowStock,
})
