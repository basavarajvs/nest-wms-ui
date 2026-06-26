import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LaborWebController_createShift,
  LaborWebController_listShifts,
  LaborWebController_updateShift,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateShiftDto, UpdateShiftDto, LaborWebControllerListShiftsParams } from '@/lib/types/wms-api'

export interface LaborShift {
  id: string
  shiftCode: string
  shiftName: string
  startTime: string
  endTime: string
  timezone?: string
  facilityId: string
  isActive: boolean
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
    if (Array.isArray(obj.shifts)) return obj.shifts as T[]
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

export function useShiftList(params?: Partial<LaborWebControllerListShiftsParams>) {
  const qp = { facilityId: params?.facilityId || '' }
  return useQuery({
    queryKey: ['wms', 'labor', 'shifts', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await LaborWebController_listShifts(p as LaborWebControllerListShiftsParams)
      return res as unknown
    },
    select: (data) => ({ shifts: safeArray<LaborShift>(data), total: safeTotal(data) }),
    enabled: !!qp.facilityId,
    staleTime: 1000 * 30,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateShiftDto) => LaborWebController_createShift(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'labor', 'shifts'] }),
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateShiftDto }) => LaborWebController_updateShift(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'labor', 'shifts'] }),
  })
}
