import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LaborWebController_assignShift,
  LaborWebController_listAssignments,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { AssignShiftDto, LaborWebControllerListAssignmentsParams } from '@/lib/types/wms-api'

export interface LaborAssignment {
  id: string
  shiftId: string
  shiftName?: string
  shiftCode?: string
  userId: string
  userName?: string
  facilityId: string
  effectiveDate: string
  expiryDate?: string
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
    if (Array.isArray(obj.assignments)) return obj.assignments as T[]
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

export function useAssignmentList(params?: Partial<LaborWebControllerListAssignmentsParams>) {
  const qp = { userId: params?.userId || '', shiftId: params?.shiftId || '' }
  const hasFilter = !!(qp.userId || qp.shiftId)
  return useQuery({
    queryKey: ['wms', 'labor', 'assignments', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await LaborWebController_listAssignments(p as LaborWebControllerListAssignmentsParams)
      return res as unknown
    },
    select: (data) => ({ assignments: safeArray<LaborAssignment>(data), total: safeTotal(data) }),
    enabled: hasFilter,
    staleTime: 1000 * 30,
  })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: AssignShiftDto) => LaborWebController_assignShift(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'labor', 'assignments'] }),
  })
}
