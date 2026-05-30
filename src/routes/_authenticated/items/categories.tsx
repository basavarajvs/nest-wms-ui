import { createFileRoute } from '@tanstack/react-router'
import { Categories } from '@/features/items/categories'

export const Route = createFileRoute('/_authenticated/items/categories')({
  component: Categories,
})
