import { createFileRoute } from '@tanstack/react-router'
import LoadingDocksPage from '@/pages/loading-docks/LoadingDocks'

export const Route = createFileRoute('/_authenticated/warehouse/loading-docks')({
  component: LoadingDocksPage,
})
