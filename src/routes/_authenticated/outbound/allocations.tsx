import { createFileRoute } from '@tanstack/react-router'
import { Allocations } from '@/pages/outbound/Allocations'

export const Route = createFileRoute('/_authenticated/outbound/allocations')({
  component: Allocations,
})
