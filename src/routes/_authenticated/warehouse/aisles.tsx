import { createFileRoute } from '@tanstack/react-router'
import AislesPage from '@/pages/warehouse/Aisles'

export const Route = createFileRoute('/_authenticated/warehouse/aisles')({
  component: AislesPage,
})
