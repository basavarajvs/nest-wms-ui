import { createFileRoute } from '@tanstack/react-router'
import RateMasterPageWrapper from '@/pages/billing/RateMasterPage'

export const Route = createFileRoute('/_authenticated/billing/rates')({
  component: RateMasterPageWrapper,
})
