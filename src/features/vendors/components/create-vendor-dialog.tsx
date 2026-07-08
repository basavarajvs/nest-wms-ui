import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { VendorForm } from '@/features/vendors/components/vendor-form'
import { useCreateVendor } from '@/features/vendors/data/vendor-queries'
import type { CreateVendorFormValues } from '@/features/vendors/schemas/vendor-schema'

interface CreateVendorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateVendorDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateVendorDialogProps) {
  const createMutation = useCreateVendor()

  const handleSubmit = useCallback(
    (values: CreateVendorFormValues) => {
      createMutation.mutate(
        {
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
    [createMutation, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Vendor"
      description="Add a new vendor."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('vendor-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <VendorForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
