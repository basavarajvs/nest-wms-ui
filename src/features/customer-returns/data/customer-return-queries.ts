import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CustomerReturnWebController_findAll,
  CustomerReturnWebController_findById,
  CustomerReturnWebController_create,
  CustomerReturnWebController_updateStatus,
  CustomerReturnWebController_delete,
  CustomerReturnItemWebController_findByReturnId,
  CustomerReturnItemWebController_create,
  CustomerReturnItemWebController_update,
  CustomerReturnItemWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateCustomerReturnDto,
  UpdateCustomerReturnDto,
  UpdateCustomerReturnDtoStatus,
  CreateReturnItemDto,
  UpdateReturnItemStandaloneDto,
  CustomerReturnWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.customerReturns)) return obj.customerReturns as T[]
    if (Array.isArray(obj.returnItems)) return obj.returnItems as T[]
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

export interface CustomerReturn {
  id: string
  returnNumber: string
  rmaNumber?: string
  facilityId: string
  clientCode?: string
  carrier?: string
  trackingNumber?: string
  status?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface CustomerReturnItem {
  id: string
  customerReturnId: string
  productId: string
  productName?: string
  quantity: number
  receivedQuantity?: number
  condition?: string
  disposition?: string
  notes?: string
}

export function useCustomerReturns(params?: CustomerReturnWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'customer-returns', 'list', stableKey],
    queryFn: async () => {
      const res = await CustomerReturnWebController_findAll(params as CustomerReturnWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      customerReturns: safeArray<CustomerReturn>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCustomerReturn(id: string) {
  return useQuery({
    queryKey: ['wms', 'customer-returns', 'detail', id],
    queryFn: async () => {
      const res = await CustomerReturnWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<CustomerReturn>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateCustomerReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCustomerReturnDto) => CustomerReturnWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}

export function useUpdateCustomerReturnStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerReturnDtoStatus }) => CustomerReturnWebController_updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}

export function useDeleteCustomerReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CustomerReturnWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}

export function useReturnItems(returnId: string) {
  return useQuery({
    queryKey: ['wms', 'customer-returns', 'items', returnId],
    queryFn: async () => {
      const res = await CustomerReturnItemWebController_findByReturnId(returnId)
      return res as unknown
    },
    select: (data) => safeArray<CustomerReturnItem>(data),
    enabled: !!returnId,
  })
}

export function useCreateReturnItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateReturnItemDto) => CustomerReturnItemWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}

export function useUpdateReturnItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateReturnItemStandaloneDto }) => CustomerReturnItemWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}

export function useDeleteReturnItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CustomerReturnItemWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customer-returns'] })
    },
  })
}
