import { createFileRoute } from '@tanstack/react-router'
import CarrierRateShoppingPage from '@/pages/carrier-rate-shopping/CarrierRateShopping'

export const Route = createFileRoute('/_authenticated/outbound/carrier-rates')({
  component: CarrierRateShoppingPage,
})
