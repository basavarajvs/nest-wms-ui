import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PurchaseOrderWebController_findAll,
  PurchaseOrderWebController_findById,
  PurchaseOrderWebController_create,
  PurchaseOrderWebController_updateStatus,
  PurchaseOrderWebController_delete,
  PurchaseOrderLineWebController_findByPoId,
  PurchaseOrderLineWebController_create,
  PurchaseOrderLineWebController_update,
  PurchaseOrderLineWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderLineDto,
  CreatePurchaseOrderLineDto,
  PurchaseOrderWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.purchaseOrders)) return obj.purchaseOrders as T[]
    if (Array.isArray(obj.lines)) return obj.lines as T[]
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

export interface PurchaseOrder {
  id: string
  poNumber: string
  facilityId: string
  vendorId?: string
  orderDate?: string
  expectedDate?: string
  notes?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface PurchaseOrderLine {
  id: string
  purchaseOrderId: string
  productId: string
  productName?: string
  quantity: number
  receivedQuantity?: number
  uomId: string
  unitCost?: number
  notes?: string
}

export function usePurchaseOrders(params?: PurchaseOrderWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'purchase-orders', 'list', stableKey],
    queryFn: async () => {
      const res = await PurchaseOrderWebController_findAll(params as PurchaseOrderWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      purchaseOrders: safeArray<PurchaseOrder>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['wms', 'purchase-orders', 'detail', id],
    queryFn: async () => {
      const res = await PurchaseOrderWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<PurchaseOrder>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderDto) => PurchaseOrderWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders'] })
    },
  })
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseOrderDto }) => PurchaseOrderWebController_updateStatus(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders'] })
    },
  })
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PurchaseOrderWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders'] })
    },
  })
}

export function usePurchaseOrderLines(poId: string) {
  return useQuery({
    queryKey: ['wms', 'purchase-orders', 'lines', poId],
    queryFn: async () => {
      const res = await PurchaseOrderLineWebController_findByPoId(poId)
      return res as unknown
    },
    select: (data) => safeArray<PurchaseOrderLine>(data),
    enabled: !!poId,
  })
}

export function useCreatePurchaseOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePurchaseOrderLineDto) => PurchaseOrderLineWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders', 'lines'] })
    },
  })
}

export function useUpdatePurchaseOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePurchaseOrderLineDto }) => PurchaseOrderLineWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders', 'lines'] })
    },
  })
}

export function useDeletePurchaseOrderLine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => PurchaseOrderLineWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'purchase-orders', 'lines'] })
    },
  })
}
