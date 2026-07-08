import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  PickingWaveWebController_findAll,
  PickingWaveWebController_findById,
  PickingWaveWebController_create,
  PickingWaveWebController_update,
  PickingWaveWebController_release,
  PickingWaveWebController_cancel,
} from '@/lib/wms-api/api/wms-api/outbound-picking-waves/outbound-picking-waves'
import type { PickingWaveDto, PickingWaveDetailDto, CreatePickingWaveDto, UpdatePickingWaveDto } from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export interface WaveQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

const keys = {
  all: ['wms', 'waves'] as const,
  list: (params?: WaveQueryParams) => ['wms', 'waves', 'list', params] as const,
  detail: (id: string) => ['wms', 'waves', id] as const,
}

export function useWavesList(params?: WaveQueryParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await PickingWaveWebController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: PickingWaveDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

export function useWaveById(waveId: string | null) {
  return useQuery({
    queryKey: keys.detail(waveId ?? ''),
    queryFn: async () => {
      const res = (await PickingWaveWebController_findById(waveId!)) as unknown as Envelope<PickingWaveDetailDto>
      return res.data as PickingWaveDetailDto
    },
    enabled: !!waveId,
  })
}

export function useCreateWave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreatePickingWaveDto) => {
      const res = (await PickingWaveWebController_create(dto)) as unknown as Envelope<PickingWaveDetailDto>
      return res.data as PickingWaveDetailDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Wave created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateWave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePickingWaveDto }) => {
      const res = (await PickingWaveWebController_update(id, data)) as unknown as Envelope<PickingWaveDetailDto>
      return res.data as PickingWaveDetailDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Wave updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useReleaseWave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = (await PickingWaveWebController_release(id)) as unknown as Envelope<PickingWaveDetailDto>
      return res.data as PickingWaveDetailDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Wave released')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useCancelWave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = (await PickingWaveWebController_cancel(id)) as unknown as Envelope<PickingWaveDetailDto>
      return res.data as PickingWaveDetailDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Wave cancelled')
    },
    onError: (error) => handleServerError(error),
  })
}

export const WAVE_STATUS_OPTIONS = ['CREATED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const WAVE_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  RELEASED: 'Released',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const WAVE_TYPE_OPTIONS = ['BATCH', 'CLUSTER', 'PALLET', 'CASE'] as const

export const WAVE_TYPE_LABELS: Record<string, string> = {
  BATCH: 'Batch',
  CLUSTER: 'Cluster',
  PALLET: 'Pallet',
  CASE: 'Case',
}
