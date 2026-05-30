import { createFileRoute } from '@tanstack/react-router'
import { Holds } from '@/features/inventory/holds'

export const Route = createFileRoute('/_authenticated/inventory/holds')({
  component: Holds,
})
