import { createFileRoute } from '@tanstack/react-router'
import RacksPage from '@/pages/warehouse/Racks'

export const Route = createFileRoute('/_authenticated/warehouse/racks')({
  component: RacksPage,
})
