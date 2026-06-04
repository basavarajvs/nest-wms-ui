import { createFileRoute } from '@tanstack/react-router'
import SetupPage from '@/pages/warehouse/SetupPage'

export const Route = createFileRoute('/_authenticated/warehouse/setup')({
  component: SetupPage,
})
