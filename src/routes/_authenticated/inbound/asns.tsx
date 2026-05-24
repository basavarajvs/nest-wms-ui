import { createFileRoute } from '@tanstack/react-router'
import { Asns } from '@/features/inbound/asns'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inbound/asns')({
  component: Asns,
})
