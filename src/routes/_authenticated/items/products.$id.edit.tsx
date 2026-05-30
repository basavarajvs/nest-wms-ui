import { createFileRoute } from '@tanstack/react-router'
import { EditProduct } from '@/pages/products/EditProduct'

export const Route = createFileRoute('/_authenticated/items/products/$id/edit')({
  component: EditProduct,
})
