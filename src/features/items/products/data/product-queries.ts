import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ProductsWebController_findAll,
  ProductsWebController_create,
  ProductsWebController_update,
  ProductsWebController_remove,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductsWebControllerFindAllParams,
} from '@/lib/types/wms-api'

// Defensive helpers (same pattern as users/dashboard)
function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.products)) return obj.products as T[]
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

export interface Product {
  id: string
  productCode: string
  name: string
  description?: string
  baseUomId?: string
  categoryId?: string
  trackLot?: boolean
  trackSerial?: boolean
  trackExpiry?: boolean
  velocityClass?: string
  isActive?: boolean
  createdAt?: string
}

export function useProducts(params?: ProductsWebControllerFindAllParams) {
  return useQuery({
    queryKey: ['wms', 'products', 'list', params],
    queryFn: async () => {
      const res = await ProductsWebController_findAll(params)
      return res as unknown
    },
    select: (data) => ({
      products: safeArray<Product>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      return ProductsWebController_create(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProductDto }) => {
      return ProductsWebController_update(id, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return ProductsWebController_remove(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'products'] })
    },
  })
}
