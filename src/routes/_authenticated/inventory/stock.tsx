import { createFileRoute } from '@tanstack/react-router'
import { Stock } from '@/features/inventory/stock'

export const Route = createFileRoute('/_authenticated/inventory/stock')({
  component: Stock,
})
