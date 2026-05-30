import { createFileRoute } from '@tanstack/react-router'
import { AdminCustomization } from '@/features/admin/customization'

export const Route = createFileRoute('/_authenticated/admin/customization')({
  component: AdminCustomization,
})
