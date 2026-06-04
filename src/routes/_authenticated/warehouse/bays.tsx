import { createFileRoute } from '@tanstack/react-router'
import BaysPage from '@/pages/warehouse/Bays'

export const Route = createFileRoute('/_authenticated/warehouse/bays')({
  component: BaysPage,
})
