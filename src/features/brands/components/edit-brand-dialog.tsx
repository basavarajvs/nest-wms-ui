import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { BrandForm } from '@/features/brands/components/brand-form'
import { useUpdateBrand } from '@/features/brands/data/brand-queries'
import type { CreateBrandFormValues } from '@/features/brands/schemas/brand-schema'
import type { BrandResponseDto } from '@/lib/wms-api/types/wms-api'

interface EditBrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: BrandResponseDto
  onSuccess?: () => void
}

export function EditBrandDialog({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: EditBrandDialogProps) {
  const updateMutation = useUpdateBrand()

  const defaultValues: CreateBrandFormValues = {
    brand_code: brand.brand_code,
    brand_name: brand.brand_name,
    description: brand.description ?? '',
    is_active: brand.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateBrandFormValues) => {
      updateMutation.mutate(
        {
          brand_id: brand.brand_id,
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
    [updateMutation, brand.brand_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Brand"
      description={`Update brand: ${brand.brand_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('brand-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <BrandForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        disabledFields={['brand_code']}
      />
    </CreateEntityDialog>
  )
}
