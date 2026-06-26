import { useQuery } from '@tanstack/react-query'
import {
  LaborWebController_listPerformance,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { LaborWebControllerListPerformanceParams } from '@/lib/types/wms-api'

export interface LaborPerformance {
  id: string
  userId: string
  userName?: string
  facilityId: string
  metricDate: string
  picksPerHour?: number
  packsPerHour?: number
  accuracyRate?: number
  score?: number
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.metrics)) return obj.metrics as T[]
    if (Array.isArray(obj.performance)) return obj.performance as T[]
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

export function usePerformanceList(params?: Partial<LaborWebControllerListPerformanceParams>) {
  const qp = { facilityId: params?.facilityId || '', userId: params?.userId || '', metricDate: params?.metricDate || '' }
  return useQuery({
    queryKey: ['wms', 'labor', 'performance', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await LaborWebController_listPerformance(p as LaborWebControllerListPerformanceParams)
      return res as unknown
    },
    select: (data) => ({ metrics: safeArray<LaborPerformance>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}
