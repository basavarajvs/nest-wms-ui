import { createFileRoute } from '@tanstack/react-router'
import ChargesPageWrapper from '@/pages/billing/ChargesPage'

export const Route = createFileRoute('/_authenticated/billing/charges')({
  component: ChargesPageWrapper,
})
