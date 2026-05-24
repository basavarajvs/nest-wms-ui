import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/items/products'

// @ts-ignore - route id will be valid after TanStack Router generator runs
export const Route = createFileRoute('/_authenticated/items/products')({
  component: Products,
})
