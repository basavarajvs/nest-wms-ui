import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import { useFacilityStore } from '@/stores/facility-store'
import {
  ReceivingInspectionController_findAll,
  ReceivingInspectionController_findById,
  InspectionWebController_supervisorApprove,
  InspectionWebController_supervisorReject,
} from '@/lib/wms-api/api/wms-api/quality/quality'
import { InspectionDefectController_findAll } from '@/lib/wms-api/api/wms-api/inspection-defects/inspection-defects'
import type {
  ReceivingInspectionDto,
  SupervisorApproveDto,
  InspectionDefectResponseDto,
} from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export interface InspectionQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

const keys = {
  all: ['wms', 'inspections'] as const,
  list: (params?: InspectionQueryParams) => ['wms', 'inspections', 'list', params] as const,
  detail: (id: string) => ['wms', 'inspections', id] as const,
  defects: (id: string) => ['wms', 'inspections', id, 'defects'] as const,
}

export function useInspectionsList(params?: InspectionQueryParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await ReceivingInspectionController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: ReceivingInspectionDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

export function useInspectionById(inspectionId: string | null) {
  return useQuery({
    queryKey: keys.detail(inspectionId ?? ''),
    queryFn: async () => {
      const res = (await ReceivingInspectionController_findById(inspectionId!)) as unknown as Envelope<ReceivingInspectionDto>
      return res.data as ReceivingInspectionDto
    },
    enabled: !!inspectionId,
  })
}

export function useApproveInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: SupervisorApproveDto }) => {
      const res = (await InspectionWebController_supervisorApprove(id, data ?? {})) as unknown as Envelope<{ approved: boolean; inspectionId: string }>
      return res.data as { approved: boolean; inspectionId: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Inspection approved')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useRejectInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = (await InspectionWebController_supervisorReject(id)) as unknown as Envelope<{ rejected: boolean; originalInspectionId: string; newInspectionId: string }>
      return res.data as { rejected: boolean; originalInspectionId: string; newInspectionId: string }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Inspection rejected')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useInspectionDefects(inspectionId: string | null) {
  return useQuery({
    queryKey: keys.defects(inspectionId ?? ''),
    queryFn: async () => {
      const res = (await InspectionDefectController_findAll({
        params: { inspection_id: inspectionId },
      } as RequestInit)) as unknown as Envelope<{ data: InspectionDefectResponseDto[]; total: number }>
      return (res.data?.data ?? []) as InspectionDefectResponseDto[]
    },
    enabled: !!inspectionId,
  })
}

export const INSPECTION_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export const INSPECTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  PENDING_REVIEW: 'Pending Review',
  PASSED: 'Passed',
  FAILED: 'Failed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}
