import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CarrierForm } from '@/features/carriers/components/carrier-form'
import { useUpdateCarrier } from '@/features/carriers/data/carrier-queries'
import type { CreateCarrierFormValues } from '@/features/carriers/schemas/carrier-schema'
import type { CarrierResponseDto } from '@/lib/wms-api/types/wms-api'

interface EditCarrierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  carrier: CarrierResponseDto
  onSuccess?: () => void
}

export function EditCarrierDialog({
  open,
  onOpenChange,
  carrier,
  onSuccess,
}: EditCarrierDialogProps) {
  const updateMutation = useUpdateCarrier()

  const defaultValues: CreateCarrierFormValues = {
    carrier_code: carrier.carrier_code,
    carrier_name: carrier.carrier_name,
    description: carrier.description ?? '',
    is_active: carrier.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateCarrierFormValues) => {
      updateMutation.mutate(
        {
          carrier_id: carrier.carrier_id,
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
    [updateMutation, carrier.carrier_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Carrier"
      description={`Update carrier: ${carrier.carrier_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('carrier-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CarrierForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
