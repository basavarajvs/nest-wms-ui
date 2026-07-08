import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CreateProductForm } from '@/features/products/components/create-product-form'
import { useCreateProduct } from '@/features/products/data/product-queries'
import type { CreateProductFormValues } from '@/features/products/schemas/product-schema'

function parseId(value: string): number | undefined {
  return value ? Number(value) : undefined
}

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductDialogProps) {
  const createMutation = useCreateProduct()

  const handleSubmit = useCallback(
    (values: CreateProductFormValues) => {
      createMutation.mutate(
        {
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
    [createMutation, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Product"
      description="Add a new product to the master data."
      isLoading={createMutation.isPending}
      submitLabel="Create Product"
      onSubmit={() => {
        const form = document.getElementById(
          'create-product-form',
        ) as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CreateProductForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
