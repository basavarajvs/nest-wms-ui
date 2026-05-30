import { createFileRoute } from '@tanstack/react-router'
import LoadsPage from '@/pages/loads/Loads'

export const Route = createFileRoute('/_authenticated/outbound/loads')({
  component: LoadsPage,
})
