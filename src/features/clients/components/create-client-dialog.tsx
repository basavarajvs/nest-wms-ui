import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { ClientForm } from '@/features/clients/components/client-form'
import { useCreateClient } from '@/features/clients/data/client-queries'
import type { CreateClientFormValues } from '@/features/clients/schemas/client-schema'

interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientDialogProps) {
  const createMutation = useCreateClient()

  const handleSubmit = useCallback(
    (values: CreateClientFormValues) => {
      createMutation.mutate(
        {
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
    [createMutation, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Client"
      description="Add a new client."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('client-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <ClientForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
