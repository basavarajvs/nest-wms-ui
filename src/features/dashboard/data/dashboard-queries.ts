import { useQuery } from '@tanstack/react-query'
import {
  OutboundWebController_listOrders,
  OutboundWebController_getPendingAllocations,
  InboundWebController_getPutawayBoard,
  OutboundWebController_getWaveBoard,
  InventoryWebController_getLowStock,
  InventoryWebController_listAdjustments,
} from '@/lib/api/wms-api/wms-web/wms-web'

// Lightweight local types since generated responses are untyped (data: void)
export interface DashboardMetric {
  count: number
  loading: boolean
  error: string | null
}

export interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  createdAt?: string
}

export interface RecentAdjustment {
  id: string
  reference?: string
  reason?: string
  createdAt?: string
}

function safeCount(data: unknown): number {
  if (Array.isArray(data)) return data.length
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items.length
    if (typeof obj.total === 'number') return obj.total
    if (Array.isArray(obj.data)) return obj.data.length
    if (Array.isArray(obj.board)) return obj.board.length
  }
  return 0
}

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.board)) return obj.board as T[]
  }
  return []
}

export function useOpenOrdersCount() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'openOrders'],
    queryFn: async () => {
      // Filter for non-finalized statuses (adjust per real backend enum if needed)
      const res = await OutboundWebController_listOrders({
        status: 'created,validated,released,allocated,on_hold',
        limit: 100,
      } as any)
      return res as unknown
    },
    select: (data) => safeCount(data),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePendingAllocationsCount() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'pendingAllocations'],
    queryFn: async () => {
      const res = await OutboundWebController_getPendingAllocations({} as any)
      return res as unknown
    },
    select: (data) => safeCount(data),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePendingPutawaysCount() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'pendingPutaways'],
    queryFn: async () => {
      const res = await InboundWebController_getPutawayBoard({} as any)
      return res as unknown
    },
    select: (data) => safeCount(data),
    staleTime: 1000 * 60 * 2,
  })
}

export function usePendingPicksCount() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'pendingPicks'],
    queryFn: async () => {
      const res = await OutboundWebController_getWaveBoard({} as any)
      return res as unknown
    },
    select: (data) => safeCount(data),
    staleTime: 1000 * 60 * 2,
  })
}

export function useLowStockCount() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'lowStock'],
    queryFn: async () => {
      const res = await InventoryWebController_getLowStock({
        threshold: 10,
      } as any)
      return res as unknown
    },
    select: (data) => safeCount(data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'recentOrders'],
    queryFn: async () => {
      const res = await OutboundWebController_listOrders({
        limit: 5,
        sort: '-createdAt',
      } as any)
      return res as unknown
    },
    select: (data): RecentOrder[] => {
      const list = safeList<any>(data)
      return list.slice(0, 5).map((o) => ({
        id: o.id ?? o._id ?? String(Math.random()),
        orderNumber: o.orderNumber ?? o.code ?? o.id ?? '—',
        status: o.status ?? 'unknown',
        createdAt: o.createdAt ?? o.created_at,
      }))
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useRecentAdjustments() {
  return useQuery({
    queryKey: ['wms', 'dashboard', 'recentAdjustments'],
    queryFn: async () => {
      const res = await InventoryWebController_listAdjustments({
        limit: 5,
        sort: '-createdAt',
      } as any)
      return res as unknown
    },
    select: (data): RecentAdjustment[] => {
      const list = safeList<any>(data)
      return list.slice(0, 5).map((a) => ({
        id: a.id ?? a._id ?? String(Math.random()),
        reference: a.reference ?? a.code ?? '—',
        reason: a.reason ?? a.adjustmentReason ?? '—',
        createdAt: a.createdAt ?? a.created_at,
      }))
    },
    staleTime: 1000 * 60 * 5,
  })
}
