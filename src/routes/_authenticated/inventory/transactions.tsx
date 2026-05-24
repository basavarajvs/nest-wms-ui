import { createFileRoute } from '@tanstack/react-router'
import { Transactions } from '@/features/inventory/transactions'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/transactions')({
  component: Transactions,
})
