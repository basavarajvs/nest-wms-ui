import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ProductPackagingWebController_findAll,
  ProductPackagingWebController_findById,
  ProductPackagingWebController_create,
  ProductPackagingWebController_update,
  ProductPackagingWebController_delete,
  ProductPackagingWebController_convert,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreatePackagingDto, UpdatePackagingDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.packaging)) return obj.packaging as T[]
    if (Array.isArray(obj.productPackaging)) return obj.productPackaging as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeArray(data).length || fallback
  }
  return fallback
}

export interface ProductPackaging {
  id: string
  productId: string
  productName?: string
  fromUomId: string
  toUomId: string
  conversionFactor: number
  isActive?: boolean
  createdAt?: string
}

export function useProductPackaging() {
  return useQuery({
    queryKey: ['wms', 'product-packaging', 'list'],
    queryFn: async () => {
      const res = await ProductPackagingWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      packaging: safeArray<ProductPackaging>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateProductPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePackagingDto) => ProductPackagingWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-packaging'] })
    },
  })
}

export function useUpdateProductPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePackagingDto }) => ProductPackagingWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-packaging'] })
    },
  })
}

export function useDeleteProductPackaging() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ProductPackagingWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-packaging'] })
    },
  })
}
