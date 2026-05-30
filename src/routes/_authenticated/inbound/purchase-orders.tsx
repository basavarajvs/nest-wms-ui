import { createFileRoute } from '@tanstack/react-router'
import PurchaseOrdersPage from '@/pages/purchase-orders/PurchaseOrders'

export const Route = createFileRoute('/_authenticated/inbound/purchase-orders')({
  component: PurchaseOrdersPage,
})
