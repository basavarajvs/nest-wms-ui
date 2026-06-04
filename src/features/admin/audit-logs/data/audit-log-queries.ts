import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AuditController_query,
  AuditController_summary,
  AuditController_export,
} from '@/lib/api/wms-saas-core-api/audit/audit'
import type { AuditControllerQueryParams } from '@/lib/types/wms-saas-core-api/auditControllerQueryParams'
import type { AuditControllerExportParams } from '@/lib/types/wms-saas-core-api/auditControllerExportParams'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.entries)) return obj.entries as T[]
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
