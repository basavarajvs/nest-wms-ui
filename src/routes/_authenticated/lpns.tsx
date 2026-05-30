import { createFileRoute } from '@tanstack/react-router'
import LpnsPage from '@/pages/lpns/Lpns'

export const Route = createFileRoute('/_authenticated/lpns')({
  component: LpnsPage,
})
