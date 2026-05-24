import { createFileRoute } from '@tanstack/react-router'
import { Warehouse } from '@/features/warehouse'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/warehouse/locations')({
  component: Warehouse,
})
