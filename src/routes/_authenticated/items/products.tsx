import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/pages/products/Products'

export const Route = createFileRoute('/_authenticated/items/products')({
  component: Products,
})
