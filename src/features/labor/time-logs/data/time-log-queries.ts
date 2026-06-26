import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LaborWebController_clockIn,
  LaborWebController_clockOut,
  LaborWebController_listTimeLogs,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { ClockInDto, ClockOutDto, LaborWebControllerListTimeLogsParams } from '@/lib/types/wms-api'

export interface LaborTimeLog {
  id: string
  userId: string
  userName?: string
  shiftId?: string
  shiftName?: string
  facilityId: string
  clockIn: string
  clockOut?: string
  breakDuration?: number
  totalMinutes?: number
  status: string
  notes?: string
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
    if (Array.isArray(obj.timeLogs)) return obj.timeLogs as T[]
    if (Array.isArray(obj.logs)) return obj.logs as T[]
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

export function useTimeLogList(params?: Partial<LaborWebControllerListTimeLogsParams>) {
  const qp = { facilityId: params?.facilityId || '', userId: params?.userId || '', date: params?.date || '' }
  return useQuery({
    queryKey: ['wms', 'labor', 'time-logs', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await LaborWebController_listTimeLogs(p as LaborWebControllerListTimeLogsParams)
      return res as unknown
    },
    select: (data) => ({ timeLogs: safeArray<LaborTimeLog>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 15,
  })
}

export function useClockIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ClockInDto) => LaborWebController_clockIn(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'labor', 'time-logs'] }),
  })
}

export function useClockOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ClockOutDto) => LaborWebController_clockOut(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'labor', 'time-logs'] }),
  })
}
