import { useCallback } from 'react'
import { CreateEntityDialog } from '@/components/common/dialogs/create-entity-dialog'
import { CategoryForm } from '@/features/categories/components/category-form'
import { useUpdateCategory } from '@/features/categories/data/category-queries'
import type { CreateCategoryFormValues } from '@/features/categories/schemas/category-schema'
import type { CategoryResponseDto } from '@/lib/wms-api/types/wms-api'

function parseId(value: string): number | undefined {
  return value ? Number(value) : undefined
}

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryResponseDto
  onSuccess?: () => void
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const updateMutation = useUpdateCategory()

  const defaultValues: CreateCategoryFormValues = {
    category_code: category.category_code,
    category_name: category.category_name,
    description: category.description ?? '',
    parent_category_id: category.parent_category_id ? String(category.parent_category_id) : '',
    is_active: category.is_active,
  }

  const handleSubmit = useCallback(
    (values: CreateCategoryFormValues) => {
      updateMutation.mutate(
        {
          category_id: category.category_id,
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
    [updateMutation, category.category_id, onOpenChange, onSuccess],
  )

  return (
    <CreateEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Category"
      description={`Update category: ${category.category_name}`}
      isLoading={updateMutation.isPending}
      submitLabel="Save"
      onSubmit={() => {
        const form = document.getElementById('category-form') as HTMLFormElement
        form?.requestSubmit()
      }}
    >
      <CategoryForm
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        isSubmitting={updateMutation.isPending}
        excludeId={category.category_id}
      />
    </CreateEntityDialog>
  )
}
