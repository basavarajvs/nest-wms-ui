import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OutboundWebController_getWaveBoard,
  OutboundWebController_createWave,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateWaveDto,
  OutboundWebControllerGetWaveBoardParams,
} from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.board)) return obj.board as T[]
    if (Array.isArray(obj.waves)) return obj.waves as T[]
    if (Array.isArray(obj.tasks)) return obj.tasks as T[]
  }
  return []
}

export interface WaveTask {
  id?: string
  orderId?: string
  productId?: string
  quantity?: number
  assignedToUserId?: string
  status?: string
  facilityId?: string
}

export function useWaveBoard(
  params: Partial<OutboundWebControllerGetWaveBoardParams> = {}
) {
  const queryParams: OutboundWebControllerGetWaveBoardParams = {
    status: params.status || '',
    facilityId: params.facilityId || '',
  }

  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'outbound', 'wave-board', stableKey],
    queryFn: async () => {
      const res = await OutboundWebController_getWaveBoard(queryParams)
      return safeList<WaveTask>(res)
    },
    staleTime: 1000 * 30,
  })
}

export function useCreateWave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateWaveDto) => {
      return OutboundWebController_createWave(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['wms', 'outbound', 'wave-board'],
      })
    },
  })
}
