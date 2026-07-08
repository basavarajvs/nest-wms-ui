import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  CategoryController_findAll,
  CategoryController_findById,
  CategoryController_create,
  CategoryController_update,
  CategoryController_delete,
} from '@/lib/wms-api/api/wms-api/product-categories/product-categories'
import type { CategoryResponseDto } from '@/lib/wms-api/types/wms-api'

interface Envelope<T> {
  success: boolean
  data: T
}

const keys = {
  all: ['wms', 'categories'] as const,
  list: () => ['wms', 'categories', 'list'] as const,
  detail: (id: number) => ['wms', 'categories', id] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: keys.list(),
    queryFn: async () => {
      const res = (await CategoryController_findAll()) as unknown as Envelope<{ categories: CategoryResponseDto[] }>
      return (res.data?.categories ?? []) as CategoryResponseDto[]
    },
  })
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await CategoryController_findById(
        String(id),
      )) as unknown as Envelope<CategoryResponseDto>
      return res.data as CategoryResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      category_code: string
      category_name: string
      description?: string
      parent_category_id?: number
      is_active?: boolean
    }) => {
      const res = (await CategoryController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<CategoryResponseDto>
      return res.data as CategoryResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Category created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      category_id: number
      category_code: string
      category_name: string
      description?: string
      parent_category_id?: number
      is_active?: boolean
    }) => {
      const { category_id, ...body } = data
      const res = (await CategoryController_update(String(category_id), {
        body,
      } as RequestInit)) as unknown as Envelope<CategoryResponseDto>
      return res.data as CategoryResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Category updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await CategoryController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Category deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
