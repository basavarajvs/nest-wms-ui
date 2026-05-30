import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ProductSuppliersWebController_findAll,
  ProductSuppliersWebController_findById,
  ProductSuppliersWebController_create,
  ProductSuppliersWebController_update,
  ProductSuppliersWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateProductSupplierDto, UpdateProductSupplierDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.productSuppliers)) return obj.productSuppliers as T[]
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

export interface ProductSupplier {
  id: string
  productId: string
  vendorId: string
  vendorSku?: string
  unitCost?: number
  currency?: string
  leadTimeDays?: number
  moq?: number
  isPreferred?: boolean
  createdAt?: string
}

export function useProductSuppliers() {
  return useQuery({
    queryKey: ['wms', 'product-suppliers', 'list'],
    queryFn: async () => {
      const res = await ProductSuppliersWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      productSuppliers: safeArray<ProductSupplier>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateProductSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductSupplierDto) => ProductSuppliersWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-suppliers'] })
    },
  })
}

export function useUpdateProductSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductSupplierDto }) => ProductSuppliersWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-suppliers'] })
    },
  })
}

export function useDeleteProductSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ProductSuppliersWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-suppliers'] })
    },
  })
}
