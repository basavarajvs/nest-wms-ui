import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { VendorForm } from '@/features/vendors/components/vendor-form'
import { useUpdateVendor } from '@/features/vendors/data/vendor-queries'
import type { CreateVendorFormValues } from '@/features/vendors/schemas/vendor-schema'
import type { VendorResponseDto } from '@/lib/wms-api/types/wms-api'

interface EditVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: VendorResponseDto
  onSuccess?: () => void
}

export function EditVendorDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: EditVendorDialogProps) {
  const updateMutation = useUpdateVendor()

  const defaultValues: CreateVendorFormValues = {
    vendor_code: vendor.vendor_code,
    vendor_name: vendor.vendor_name,
    description: vendor.description ?? '',
    is_active: vendor.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateVendorFormValues) => {
      updateMutation.mutate(
        {
          vendor_id: vendor.vendor_id,
          vendor_code: values.vendor_code,
          vendor_name: values.vendor_name,
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
    [updateMutation, vendor.vendor_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Vendor"
      description={`Update vendor: ${vendor.vendor_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('vendor-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <VendorForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
