import { createFileRoute } from '@tanstack/react-router'
import InvoiceDetailPageWrapper from '@/pages/billing/InvoiceDetailPage'

export const Route = createFileRoute('/_authenticated/billing/invoices/$id')({
  component: InvoiceDetailRoute,
})

function InvoiceDetailRoute() {
  const { id } = Route.useParams()
  return <InvoiceDetailPageWrapper invoiceId={id} />
}
