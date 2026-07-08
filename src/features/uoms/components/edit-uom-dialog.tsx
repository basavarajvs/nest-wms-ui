import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { UomForm } from '@/features/uoms/components/uom-form'
import { useUpdateUom } from '@/features/uoms/data/uom-queries'
import type { CreateUomFormValues } from '@/features/uoms/schemas/uom-schema'
import type { UomResponseDto } from '@/lib/wms-api/types/wms-api'

interface EditUomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  uom: UomResponseDto
  onSuccess?: () => void
}

export function EditUomDialog({
  open,
  onOpenChange,
  uom,
  onSuccess,
}: EditUomDialogProps) {
  const updateMutation = useUpdateUom()

  const defaultValues: CreateUomFormValues = {
    uom_code: uom.uom_code,
    uom_name: uom.uom_name,
    description: uom.description ?? '',
    is_active: uom.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateUomFormValues) => {
      updateMutation.mutate(
        {
          uom_id: uom.uom_id,
          uom_code: values.uom_code,
          uom_name: values.uom_name,
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
    [updateMutation, uom.uom_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit UOM"
      description={`Update unit of measure: ${uom.uom_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('uom-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <UomForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        disabledFields={['uom_code']}
      />
    </CreateEntityDialog>
  )
}
