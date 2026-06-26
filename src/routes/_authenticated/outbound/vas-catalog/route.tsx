import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/outbound/vas-catalog')({
  component: () => <Outlet />,
})
