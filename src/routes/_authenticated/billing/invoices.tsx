import { createFileRoute } from '@tanstack/react-router'
import InvoicesPageWrapper from '@/pages/billing/InvoicesPage'

export const Route = createFileRoute('/_authenticated/billing/invoices')({
  component: InvoicesPageWrapper,
})
