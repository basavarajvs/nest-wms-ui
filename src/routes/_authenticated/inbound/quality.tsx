import { createFileRoute } from '@tanstack/react-router'
import QualityDashboard from '@/pages/inbound/QualityDashboard'

export const Route = createFileRoute('/_authenticated/inbound/quality')({
  component: QualityDashboard,
})
