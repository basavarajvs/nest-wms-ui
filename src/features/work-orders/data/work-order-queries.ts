import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  WorkOrdersWebController_findAll,
  WorkOrdersWebController_findById,
  WorkOrdersWebController_create,
  WorkOrdersWebController_update,
  WorkOrdersWebController_release,
  WorkOrdersWebController_complete,
  WorkOrdersWebController_cancel,
  WorkOrdersWebController_addOperation,
  WorkOrdersWebController_updateOperation,
  WorkOrdersWebController_addComponent,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  CreateOperationDto,
  UpdateOperationDto,
  CreateComponentDto,
  WorkOrdersWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.workOrders)) return obj.workOrders as T[]
    if (Array.isArray(obj.operations)) return obj.operations as T[]
    if (Array.isArray(obj.components)) return obj.components as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    return safeArray(data).length
  }
  return 0
}

export interface WorkOrder {
  id: string
  workOrderNumber?: string
  workOrderType: string
  status: string
  priority?: string
  productId?: string
  quantity?: number
  uomId?: string
  clientId?: string
  facilityId: string
  assignedToUserId?: string
  scheduledDate?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
  completedAt?: string
  cancelledAt?: string
  operations?: WorkOrderOperation[]
  components?: WorkOrderComponent[]
}

export interface WorkOrderOperation {
  id: string
  sequenceNumber: number
  operationName: string
  operationType: string
  assignedToUserId?: string
  estimatedMinutes?: number
  actualMinutes?: number
  status?: string
  notes?: string
}

export interface WorkOrderComponent {
  id: string
  productId: string
  lotId?: string
  quantityRequired: number
  quantityConsumed?: number
  uomId: string
  notes?: string
}

export function useWorkOrderList(params?: Partial<WorkOrdersWebControllerFindAllParams>) {
  const qp = { facilityId: params?.facilityId || '', status: params?.status || '', workOrderType: params?.workOrderType || '' }
  return useQuery({
    queryKey: ['wms', 'work-orders', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , p] = queryKey
      const res = await WorkOrdersWebController_findAll(p as WorkOrdersWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({ workOrders: safeArray<WorkOrder>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['wms', 'work-orders', 'detail', id],
    queryFn: async ({ queryKey }) => {
      const [, , , woId] = queryKey
      const res = await WorkOrdersWebController_findById(woId)
      return res as unknown
    },
    select: (data) => {
      const d = data as Record<string, unknown> | null
      return (d?.workOrder ?? d ?? {}) as WorkOrder
    },
    enabled: !!id,
  })
}

export function useCreateWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWorkOrderDto) => WorkOrdersWebController_create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkOrderDto }) =>
      WorkOrdersWebController_update(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useReleaseWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => WorkOrdersWebController_release(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useCompleteWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => WorkOrdersWebController_complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useCancelWorkOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => WorkOrdersWebController_cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useAddOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateOperationDto }) =>
      WorkOrdersWebController_addOperation(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useUpdateOperation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, opId, dto }: { id: string; opId: string; dto: UpdateOperationDto }) =>
      WorkOrdersWebController_updateOperation(id, opId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}

export function useAddComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateComponentDto }) =>
      WorkOrdersWebController_addComponent(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'work-orders'] }),
  })
}
