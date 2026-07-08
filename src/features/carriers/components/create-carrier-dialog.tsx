import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CarrierForm } from '@/features/carriers/components/carrier-form'
import { useCreateCarrier } from '@/features/carriers/data/carrier-queries'
import type { CreateCarrierFormValues } from '@/features/carriers/schemas/carrier-schema'

interface CreateCarrierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCarrierDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCarrierDialogProps) {
  const createMutation = useCreateCarrier()

  const handleSubmit = useCallback(
    (values: CreateCarrierFormValues) => {
      createMutation.mutate(
        {
          carrier_code: values.carrier_code,
          carrier_name: values.carrier_name,
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
      title="Create Carrier"
      description="Add a new carrier."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('carrier-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CarrierForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
