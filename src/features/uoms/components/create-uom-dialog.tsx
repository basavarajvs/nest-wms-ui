import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { UomForm } from '@/features/uoms/components/uom-form'
import { useCreateUom } from '@/features/uoms/data/uom-queries'
import type { CreateUomFormValues } from '@/features/uoms/schemas/uom-schema'

interface CreateUomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateUomDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateUomDialogProps) {
  const createMutation = useCreateUom()

  const handleSubmit = useCallback(
    (values: CreateUomFormValues) => {
      createMutation.mutate(
        {
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
    [createMutation, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create UOM"
      description="Add a new unit of measure."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('uom-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <UomForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
