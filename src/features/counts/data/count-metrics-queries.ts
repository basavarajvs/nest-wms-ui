import { useQuery } from '@tanstack/react-query'
import {
  CountMetricsWebController_getAggregateMetrics,
  CountMetricsWebController_getMetrics,
  CountMetricsWebController_getAccuracyRecords,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CountMetricsWebControllerGetAggregateMetricsParams,
  CountMetricsWebControllerGetAccuracyRecordsParams,
} from '@/lib/types/wms-api'

export interface CountMetrics {
  totalLines?: number
  countedLines?: number
  accuracyRate?: number
  zeroVarianceLines?: number
  positiveVarianceLines?: number
  negativeVarianceLines?: number
  facilityId?: string
  computedAt?: string
}

export interface CountAccuracyRecord {
  id: string
  productId: string
  productName?: string
  productSku?: string
  locationId: string
  locationName?: string
  systemQuantity: number
  countedQuantity: number
  variance: number
  accuracyScore: number
  recordedAt: string
  cycleCountId?: string
}

function pickMetrics(data: unknown): CountMetrics {
  if (!data || typeof data !== 'object') return {}
  const obj = data as Record<string, unknown>
  return {
    totalLines: typeof obj.totalLines === 'number' ? obj.totalLines : undefined,
    countedLines: typeof obj.countedLines === 'number' ? obj.countedLines : undefined,
    accuracyRate: typeof obj.accuracyRate === 'number' ? obj.accuracyRate : undefined,
    zeroVarianceLines: typeof obj.zeroVarianceLines === 'number' ? obj.zeroVarianceLines : undefined,
    positiveVarianceLines: typeof obj.positiveVarianceLines === 'number' ? obj.positiveVarianceLines : undefined,
    negativeVarianceLines: typeof obj.negativeVarianceLines === 'number' ? obj.negativeVarianceLines : undefined,
    facilityId: typeof obj.facilityId === 'string' ? obj.facilityId : undefined,
    computedAt: typeof obj.computedAt === 'string' ? obj.computedAt : undefined,
  }
}

function safeAccuracyRecords(data: unknown): CountAccuracyRecord[] {
  if (Array.isArray(data)) return data as CountAccuracyRecord[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as CountAccuracyRecord[]
    if (Array.isArray(obj.data)) return obj.data as CountAccuracyRecord[]
    if (Array.isArray(obj.records)) return obj.records as CountAccuracyRecord[]
  }
  return []
}

export function useCountMetrics(params?: CountMetricsWebControllerGetAggregateMetricsParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'count-metrics', 'aggregate', stableKey],
    queryFn: async () => {
      const res = await CountMetricsWebController_getAggregateMetrics(params)
      return res as unknown
    },
    select: (data) => pickMetrics(data),
    staleTime: 1000 * 60,
  })
}

export function useCountMetricsById(id: string) {
  return useQuery({
    queryKey: ['wms', 'count-metrics', 'by-id', id],
    queryFn: async () => {
      const res = await CountMetricsWebController_getMetrics(id)
      return res as unknown
    },
    select: (data) => pickMetrics(data),
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

export function useCountAccuracy(params?: CountMetricsWebControllerGetAccuracyRecordsParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'count-accuracy', stableKey],
    queryFn: async () => {
      const res = await CountMetricsWebController_getAccuracyRecords(params)
      return res as unknown
    },
    select: (data) => ({
      records: safeAccuracyRecords(data),
      total: Array.isArray(data) ? data.length : (data && typeof data === 'object' ? ((data as Record<string, unknown>).total as number ?? safeAccuracyRecords(data).length) : 0),
    }),
    staleTime: 1000 * 60,
  })
}
