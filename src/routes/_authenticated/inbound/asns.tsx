import { createFileRoute } from '@tanstack/react-router'
import AsnsPage from '@/pages/inbound/Asns'

export const Route = createFileRoute('/_authenticated/inbound/asns')({
  component: AsnsPage,
})
