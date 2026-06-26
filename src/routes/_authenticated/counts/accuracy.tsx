import { createFileRoute } from '@tanstack/react-router'
import { CountAccuracyPage } from '@/pages/counts/CountAccuracyPage'

export const Route = createFileRoute('/_authenticated/counts/accuracy')({
  component: CountAccuracyPage,
})
