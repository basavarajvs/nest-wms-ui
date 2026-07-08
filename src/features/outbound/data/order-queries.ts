import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess, showWarning } from '@/lib/toast'
import { SalesOrderWebController_findAll, SalesOrderWebController_findById } from '@/lib/wms-api/api/wms-api/outbound-sales-orders/outbound-sales-orders'
import { AllocationWebController_findByOrderId, AllocationWebController_allocateOrder } from '@/lib/wms-api/api/wms-api/outbound-allocation/outbound-allocation'
import { PickingTaskWebController_findAll } from '@/lib/wms-api/api/wms-api/outbound-picking-tasks/outbound-picking-tasks'
import type { SalesOrderDto, SalesOrderDetailDto, OrderLineDto, AllocationRecordDto, AllocateOrderDto } from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export interface OrderQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

const keys = {
  all: ['wms', 'orders'] as const,
  list: (params?: OrderQueryParams) => ['wms', 'orders', 'list', params] as const,
  detail: (id: string) => ['wms', 'orders', id] as const,
  allocations: (id: string) => ['wms', 'orders', id, 'allocations'] as const,
  pickingTasks: (id: string) => ['wms', 'orders', id, 'picking-tasks'] as const,
}

export function useOrdersList(params?: OrderQueryParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await SalesOrderWebController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: SalesOrderDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

export function useOrderById(orderId: string | null) {
  return useQuery({
    queryKey: keys.detail(orderId ?? ''),
    queryFn: async () => {
      const res = (await SalesOrderWebController_findById(orderId!)) as unknown as Envelope<SalesOrderDetailDto>
      return res.data as SalesOrderDetailDto
    },
    enabled: !!orderId,
  })
}

export function useOrderAllocations(orderId: string | null) {
  return useQuery({
    queryKey: keys.allocations(orderId ?? ''),
    queryFn: async () => {
      const res = (await AllocationWebController_findByOrderId(orderId!)) as unknown as Envelope<AllocationRecordDto[]>
      return (res.data ?? []) as AllocationRecordDto[]
    },
    enabled: !!orderId,
  })
}

export function useOrderPickingTasks(orderId: string | null) {
  return useQuery({
    queryKey: keys.pickingTasks(orderId ?? ''),
    queryFn: async () => {
      const res = (await PickingTaskWebController_findAll({
        params: { orderId },
      } as RequestInit)) as unknown as Envelope<{ data: unknown[]; total: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0 }
    },
    enabled: !!orderId,
  })
}

export function useAllocateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: AllocateOrderDto) => {
      const res = (await AllocationWebController_allocateOrder(dto)) as unknown as Envelope<{ orderId: string; results: unknown[]; totalShort: number }>
      return res.data as { orderId: string; results: unknown[]; totalShort: number }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.all })
      if (data.totalShort > 0) {
        showWarning(`Order allocated with ${data.totalShort} short items`)
      } else {
        showSuccess('Order fully allocated')
      }
    },
    onError: (error) => handleServerError(error),
  })
}

export const ORDER_STATUS_OPTIONS = ['NEW', 'ALLOCATED', 'PICKING', 'PACKED', 'SHIPPED', 'CANCELLED'] as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ALLOCATED: 'Allocated',
  PICKING: 'Picking',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  CANCELLED: 'Cancelled',
}
