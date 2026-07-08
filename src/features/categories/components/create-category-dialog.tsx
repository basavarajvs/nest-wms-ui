import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CategoryForm } from '@/features/categories/components/category-form'
import { useCreateCategory } from '@/features/categories/data/category-queries'
import type { CreateCategoryFormValues } from '@/features/categories/schemas/category-schema'

function parseId(value: string): number | undefined {
  return value ? Number(value) : undefined
}

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryDialogProps) {
  const createMutation = useCreateCategory()

  const handleSubmit = useCallback(
    (values: CreateCategoryFormValues) => {
      createMutation.mutate(
        {
          category_code: values.category_code,
          category_name: values.category_name,
          description: values.description || undefined,
          parent_category_id: parseId(values.parent_category_id ?? ''),
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
      title="Create Category"
      description="Add a new product category."
      isLoading={createMutation.isPending}
      submitLabel="Create"
      onSubmit={() => {
        const form = document.getElementById('category-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CategoryForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </CreateEntityDialog>
  )
}
