import { createFileRoute } from '@tanstack/react-router'
import { Holds } from '@/features/inventory/holds'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inventory/holds')({
  component: Holds,
})
