import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { BrandForm } from '@/features/brands/components/brand-form'
import { useCreateBrand } from '@/features/brands/data/brand-queries'
import type { CreateBrandFormValues } from '@/features/brands/schemas/brand-schema'

interface CreateBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateBrandDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBrandDialogProps) {
  const createMutation = useCreateBrand()

  const handleSubmit = useCallback(
    (values: CreateBrandFormValues) => {
      createMutation.mutate(
        {
          brand_code: values.brand_code,
          brand_name: values.brand_name,
          description: values.description || undefined,
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
      title="Create Brand"
      description="Add a new product brand."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('brand-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <BrandForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
