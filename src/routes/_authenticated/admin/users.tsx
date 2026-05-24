import { createFileRoute } from '@tanstack/react-router'
import { AdminUsers } from '@/features/admin/users'

// @ts-ignore - route id will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsers,
})
