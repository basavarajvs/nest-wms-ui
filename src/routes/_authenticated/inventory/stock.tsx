import { createFileRoute } from '@tanstack/react-router'
import { Stock } from '@/features/inventory/stock'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/stock')({
  component: Stock,
})
