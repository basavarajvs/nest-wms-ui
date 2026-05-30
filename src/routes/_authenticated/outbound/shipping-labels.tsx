import { createFileRoute } from '@tanstack/react-router'
import ShippingLabelsPage from '@/pages/shipping-labels/ShippingLabels'

export const Route = createFileRoute('/_authenticated/outbound/shipping-labels')({
  component: ShippingLabelsPage,
})
