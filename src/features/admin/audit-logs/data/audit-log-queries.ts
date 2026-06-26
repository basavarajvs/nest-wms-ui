import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AuditController_query,
  AuditController_summary,
  AuditController_export,
} from '@/lib/api/wms-saas-core-api/audit/audit'
import {
  AuditController_getEvent,
  getAuditControllerQueryEventsUrl,
} from '@/lib/api/wms-api/wms-web/wms-web'
import { AXIOS_INSTANCE } from '@/lib/httpClient'
import type { AuditControllerQueryParams } from '@/lib/types/wms-saas-core-api/auditControllerQueryParams'
import type { AuditControllerExportParams } from '@/lib/types/wms-saas-core-api/auditControllerExportParams'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.entries)) return obj.entries as T[]
    if (Array.isArray(obj.events)) return obj.events as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    const arr = safeArray(obj)
    if (arr.length) return arr.length
  }
  return fallback
}

export interface AuditLog {
  id: string
  userId?: string
  userEmail?: string
  eventType?: string
  resourceType?: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt?: string
}

export interface AuditSummary {
  totalLogs?: number
  periodStart?: string
  periodEnd?: string
  eventTypeCounts?: Record<string, number>
}

export function useAuditLogs(params?: AuditControllerQueryParams) {
  return useQuery({
    queryKey: ['saas', 'audit', 'list', params],
    queryFn: async () => {
      const res = await AuditController_query(params)
      return res as unknown
    },
    select: (data) => ({
      logs: safeArray<AuditLog>(data),
      total: safeTotal(data, safeArray<AuditLog>(data).length),
    }),
    staleTime: 1000 * 60 * 1,
  })
}

export function useAuditSummary() {
  return useQuery({
    queryKey: ['saas', 'audit', 'summary'],
    queryFn: async () => {
      const res = await AuditController_summary()
      return res as unknown
    },
    select: (data) => (data ? (data as AuditSummary) : null),
    staleTime: 1000 * 60 * 5,
  })
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async (params?: AuditControllerExportParams) => {
      const res = await AuditController_export(params)
      return res as unknown
    },
  })
}

export interface WarehouseEvent {
  id: string
  eventType: string
  entityType: string
  entityId: string
  source: string
  performedBy: string
  occurredAt: string
  eventData?: Record<string, unknown>
  description?: string
  createdAt?: string
}

export interface EventListParams {
  eventType?: string
  entityType?: string
  source?: string
  dateFrom?: string
  dateTo?: string
}

export function useEventList(params: EventListParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'events', 'list', stableKey],
    queryFn: async () => {
      const baseUrl = getAuditControllerQueryEventsUrl()
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const qs = searchParams.toString()
      const url = qs ? `${baseUrl}?${qs}` : baseUrl
      const response = await AXIOS_INSTANCE.get(url)
      return response.data as unknown
    },
    select: (data) => ({
      events: safeArray<WarehouseEvent>(data),
      total: safeTotal(data, safeArray<WarehouseEvent>(data).length),
    }),
    staleTime: 1000 * 60 * 1,
  })
}

export function useEvent(id: string | null) {
  return useQuery({
    queryKey: ['wms', 'events', 'detail', id],
    queryFn: async () => {
      if (!id) return null
      const res = await AuditController_getEvent(id)
      return (res ?? {}) as WarehouseEvent
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}
