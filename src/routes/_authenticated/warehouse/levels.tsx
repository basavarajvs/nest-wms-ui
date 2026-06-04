import { createFileRoute } from '@tanstack/react-router'
import LevelsPage from '@/pages/warehouse/Levels'

export const Route = createFileRoute('/_authenticated/warehouse/levels')({
  component: LevelsPage,
})
