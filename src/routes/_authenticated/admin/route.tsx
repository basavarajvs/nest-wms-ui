import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

// @ts-ignore - route id will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/admin')({
  component: () => <Outlet />,
})
