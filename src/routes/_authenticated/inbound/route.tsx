import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

// @ts-ignore - route will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/inbound')({
  component: () => <Outlet />,
})
