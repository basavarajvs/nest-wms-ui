import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { ClientForm } from '@/features/clients/components/client-form'
import { useUpdateClient } from '@/features/clients/data/client-queries'
import type { CreateClientFormValues } from '@/features/clients/schemas/client-schema'
import type { ClientResponseDto } from '@/lib/wms-api/types/wms-api'

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientResponseDto
  onSuccess?: () => void
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: EditClientDialogProps) {
  const updateMutation = useUpdateClient()

  const defaultValues: CreateClientFormValues = {
    client_code: client.client_code,
    client_name: client.client_name,
    description: client.description ?? '',
    is_active: client.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateClientFormValues) => {
      updateMutation.mutate(
        {
          client_id: client.client_id,
          client_code: values.client_code,
          client_name: values.client_name,
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
    [updateMutation, client.client_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Client"
      description={`Update client: ${client.client_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('client-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <ClientForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        disabledFields={['client_code']}
      />
    </CreateEntityDialog>
  )
}
