import { createFileRoute } from '@tanstack/react-router'
import { HazmatMaterialsPage } from '@/features/quality/hazmat'

export const Route = createFileRoute('/_authenticated/quality/hazmat')({
  component: HazmatMaterialsPage,
})
