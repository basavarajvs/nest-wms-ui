import { createFileRoute } from '@tanstack/react-router'
import CustomerReturnsPage from '@/pages/customer-returns/CustomerReturns'

export const Route = createFileRoute('/_authenticated/inbound/customer-returns')({
  component: CustomerReturnsPage,
})
