import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ProductClientAssignmentsWebController_findAll,
  ProductClientAssignmentsWebController_findById,
  ProductClientAssignmentsWebController_findByClient,
  ProductClientAssignmentsWebController_findByProduct,
  ProductClientAssignmentsWebController_create,
  ProductClientAssignmentsWebController_update,
  ProductClientAssignmentsWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateProductClientAssignmentDto, UpdateProductClientAssignmentDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.assignments)) return obj.assignments as T[]
    if (Array.isArray(obj.productClientAssignments)) return obj.productClientAssignments as T[]
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

export interface ProductClientAssignment {
  id: string
  productId: string
  clientId: string
  facilityId: string
  effectiveDate?: string
  expiryDate?: string
  notes?: string
  isActive?: boolean
  createdAt?: string
}

export function useProductClientAssignments() {
  return useQuery({
    queryKey: ['wms', 'product-client-assignments', 'list'],
    queryFn: async () => {
      const res = await ProductClientAssignmentsWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      assignments: safeArray<ProductClientAssignment>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreateProductClientAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductClientAssignmentDto) => ProductClientAssignmentsWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-client-assignments'] })
    },
  })
}

export function useUpdateProductClientAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductClientAssignmentDto }) => ProductClientAssignmentsWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-client-assignments'] })
    },
  })
}

export function useDeleteProductClientAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ProductClientAssignmentsWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'product-client-assignments'] })
    },
  })
}
