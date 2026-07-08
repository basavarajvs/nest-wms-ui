import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { FacilityForm } from '@/features/facilities/components/facility-form'
import { useUpdateFacility } from '@/features/facilities/data/facility-queries'
import type { CreateFacilityFormValues } from '@/features/facilities/schemas/facility-schema'
import type { Facility } from '@/features/facilities/data/facility-queries'

interface EditFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facility: Facility
  onSuccess?: () => void
}

export function EditFacilityDialog({
  open,
  onOpenChange,
  facility,
  onSuccess,
}: EditFacilityDialogProps) {
  const updateMutation = useUpdateFacility()

  const defaultValues: CreateFacilityFormValues = {
    facility_code: facility.facility_code,
    facility_name: facility.facility_name,
    facility_type: facility.facility_type ?? '',
    description: facility.description ?? '',
    address_line1: facility.address_line1 ?? '',
    address_line2: facility.address_line2 ?? '',
    city: facility.city ?? '',
    state_province: facility.state_province ?? '',
    postal_code: facility.postal_code ?? '',
    country_code: facility.country_code ?? '',
    contact_person: facility.contact_person ?? '',
    contact_phone: facility.contact_phone ?? '',
    contact_email: facility.contact_email ?? '',
    timezone_name: facility.timezone_name ?? '',
    is_active: facility.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateFacilityFormValues) => {
      updateMutation.mutate(
        {
          facility_id: facility.facility_id,
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
    [updateMutation, facility.facility_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Facility"
      description={`Update facility: ${facility.facility_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      className="sm:max-w-[660px]"
      onSubmit={() => {
        const form = document.getElementById('facility-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <FacilityForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
