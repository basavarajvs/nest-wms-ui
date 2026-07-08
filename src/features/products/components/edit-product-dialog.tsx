import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CreateProductForm } from '@/features/products/components/create-product-form'
import { useUpdateProduct } from '@/features/products/data/product-queries'
import type { CreateProductFormValues } from '@/features/products/schemas/product-schema'
import type { Product } from '@/features/products/types/product'

function parseId(value: string): number | undefined {
  return value ? Number(value) : undefined
}

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onSuccess?: () => void
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductDialogProps) {
  const updateMutation = useUpdateProduct()

  const defaultValues: CreateProductFormValues = {
    product_code: product.product_code,
    product_name: product.product_name,
    description: product.description ?? '',
    brand_id: product.brand_id ? String(product.brand_id) : '',
    category_id: product.category_id ? String(product.category_id) : '',
    primary_uom_id: product.primary_uom_id ? String(product.primary_uom_id) : '',
    is_active: product.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateProductFormValues) => {
      updateMutation.mutate(
        {
          product_id: product.product_id,
          product_code: values.product_code,
          product_name: values.product_name,
          description: values.description || undefined,
          brand_id: parseId(values.brand_id ?? ''),
          category_id: parseId(values.category_id ?? ''),
          primary_uom_id: parseId(values.primary_uom_id ?? ''),
          is_active: values.is_active,
        },
        {
          onSuccess: () => {
            onOpenChange(false)
            onSuccess?.()
          },
        },
      )
    },
    [updateMutation, product.product_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Product"
      description={`Update product: ${product.product_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save Changes"
      onSubmit={() => {
        const form = document.getElementById(
          'create-product-form',
        ) as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CreateProductForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        disabledFields={['product_code']}
      />
    </CreateEntityDialog>
  )
}
