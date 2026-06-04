import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CategoryWebController_findAll,
  CategoryWebController_findById,
  CategoryWebController_create,
  CategoryWebController_update,
  CategoryWebController_delete,
  CategoryWebController_getTree,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.categories)) return obj.categories as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    const arr = safeArray(obj)
    return arr.length || fallback
  }
  return fallback
}

export interface Category {
  id: string
  categoryCode: string
  name: string
  parentId?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export function useCategories() {
  return useQuery({
    queryKey: ['wms', 'categories'],
    queryFn: async () => {
      const res = await CategoryWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      categories: safeArray<Category>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ['wms', 'categories', id],
    queryFn: async () => {
      const res = await CategoryWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['wms', 'categories', 'tree'],
    queryFn: async () => {
      const res = await CategoryWebController_getTree()
      return res as unknown
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateCategoryDto) => {
      return CategoryWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCategoryDto }) => {
      return CategoryWebController_update(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return CategoryWebController_delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'categories'] })
    },
  })
}
