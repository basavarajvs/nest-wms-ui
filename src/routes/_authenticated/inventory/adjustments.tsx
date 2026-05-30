import { createFileRoute } from '@tanstack/react-router'
import { Adjustments } from '@/features/inventory/adjustments'

export const Route = createFileRoute('/_authenticated/inventory/adjustments')({
  component: Adjustments,
})
