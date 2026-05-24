import { createFileRoute } from '@tanstack/react-router'
import { Waves } from '@/features/outbound/waves'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/outbound/waves')({
  component: Waves,
})
