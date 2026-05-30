import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BrandWebController_findAll,
  BrandWebController_findById,
  BrandWebController_create,
  BrandWebController_update,
  BrandWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateBrandDto, UpdateBrandDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.brands)) return obj.brands as T[]
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

export interface Brand {
  id: string
  brandCode: string
  name: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export function useBrands() {
  return useQuery({
    queryKey: ['wms', 'brands', 'list'],
    queryFn: async () => {
      const res = await BrandWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      brands: safeArray<Brand>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ['wms', 'brands', 'detail', id],
    queryFn: async () => {
      const res = await BrandWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Brand>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBrandDto) => BrandWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'brands'] })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateBrandDto }) => BrandWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'brands'] })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => BrandWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'brands'] })
    },
  })
}
