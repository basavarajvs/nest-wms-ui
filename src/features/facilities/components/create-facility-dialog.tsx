import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { FacilityForm } from '@/features/facilities/components/facility-form'
import { useCreateFacility } from '@/features/facilities/data/facility-queries'
import type { CreateFacilityFormValues } from '@/features/facilities/schemas/facility-schema'

interface CreateFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateFacilityDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateFacilityDialogProps) {
  const createMutation = useCreateFacility()

  const handleSubmit = useCallback(
    (values: CreateFacilityFormValues) => {
      createMutation.mutate(
        {
          facility_code: values.facility_code,
          facility_name: values.facility_name,
          facility_type: values.facility_type || undefined,
          description: values.description || undefined,
          address_line1: values.address_line1 || undefined,
          address_line2: values.address_line2 || undefined,
          city: values.city || undefined,
          state_province: values.state_province || undefined,
          postal_code: values.postal_code || undefined,
          country_code: values.country_code || undefined,
          contact_person: values.contact_person || undefined,
          contact_phone: values.contact_phone || undefined,
          contact_email: values.contact_email || undefined,
          timezone_name: values.timezone_name || undefined,
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
      title="Create Facility"
      description="Add a new warehouse facility."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      className="sm:max-w-[660px]"
      onSubmit={() => {
        const form = document.getElementById('facility-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <FacilityForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
