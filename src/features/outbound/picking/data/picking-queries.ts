import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  OutboundWebController_getWaveBoard,
} from '@/lib/api/wms-api/wms-web/wms-web'
import {
  OutboundRfController_confirmPick,
} from '@/lib/api/wms-api/wms-rf/wms-rf'
import type { ConfirmPickDto } from '@/lib/types/wms-api/confirmPickDto'
import type { OutboundWebControllerGetWaveBoardParams } from '@/lib/types/wms-api'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.tasks)) return obj.tasks as T[]
    if (Array.isArray(obj.board)) return obj.board as T[]
  }
  return []
}

export interface PickTask {
  id?: string
  orderId?: string
  productId?: string
  productName?: string
  productSku?: string
  quantity?: number
  assignedToUserId?: string
  status?: string
  facilityId?: string
  locationId?: string
  locationCode?: string
  createdAt?: string
}

export function usePickTasks(params: Partial<OutboundWebControllerGetWaveBoardParams> = {}) {
  const queryParams: OutboundWebControllerGetWaveBoardParams = {
    status: params.status || '',
    facilityId: params.facilityId || '',
  }

  const stableKey = JSON.stringify(queryParams)
  return useQuery({
    queryKey: ['wms', 'outbound', 'pick-tasks', stableKey],
    queryFn: async () => {
      const res = await OutboundWebController_getWaveBoard(queryParams)
      return safeList<PickTask>(res)
    },
    staleTime: 1000 * 15,
  })
}

export function useConfirmPick() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: ConfirmPickDto) => {
      return OutboundRfController_confirmPick(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'pick-tasks'] })
    },
  })
}
