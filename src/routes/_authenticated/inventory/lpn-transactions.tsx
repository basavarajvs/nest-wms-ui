import { createFileRoute } from '@tanstack/react-router'
import { LpnTransactionsPage } from '@/pages/lpns/LpnTransactionsPage'

export const Route = createFileRoute('/_authenticated/inventory/lpn-transactions')({
  component: LpnTransactionsPage,
})
