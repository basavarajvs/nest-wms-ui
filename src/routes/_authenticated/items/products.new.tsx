import { createFileRoute } from '@tanstack/react-router'
import { CreateProduct } from '@/pages/products/CreateProduct'

export const Route = createFileRoute('/_authenticated/items/products/new')({
  component: CreateProduct,
})
