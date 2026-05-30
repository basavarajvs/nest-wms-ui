import { useQuery } from '@tanstack/react-query'
import { InboundWebController_getPutawayBoard } from '@/lib/api/wms-api/wms-web/wms-web'
import type { InboundWebControllerGetPutawayBoardParams } from '@/lib/types/wms-api'

export interface PutawayTask {
  id?: string
  asnId?: string
  grnId?: string
  productId?: string
  quantity?: number
  suggestedLocationId?: string
  assignedToUserId?: string
  status?: string
  priority?: number
}

export interface PutawayBoardResponse {
  tasks: PutawayTask[]
  total?: number
  totalPages?: number
  page?: number
  limit?: number
}

function extractBoard<T>(data: unknown, params: InboundWebControllerGetPutawayBoardParams): {
  items: T[]
  total: number
  totalPages: number
} {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const items: T[] =
      (Array.isArray(obj.tasks) ? obj.tasks :
      Array.isArray(obj.items) ? obj.items :
      Array.isArray(obj.board) ? obj.board :
      Array.isArray(obj.data) ? obj.data :
      Array.isArray(obj) ? obj :
      []) as T[]

    const total = typeof obj.total === 'number' ? obj.total :
      typeof obj.totalItems === 'number' ? obj.totalItems :
      items.length

    const totalPages = typeof obj.totalPages === 'number' ? obj.totalPages :
      Math.max(1, Math.ceil(total / params.limit))

    return { items, total, totalPages }
  }
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length, totalPages: 1 }
  }
  return { items: [], total: 0, totalPages: 1 }
}

export function usePutawayBoard(
  params: Partial<InboundWebControllerGetPutawayBoardParams> = {}
) {
  const fullParams: InboundWebControllerGetPutawayBoardParams = {
    status: params.status ?? '',
    assignedToUserId: params.assignedToUserId ?? '',
    priority: params.priority ?? 0,
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  }

  return useQuery({
    queryKey: ['wms', 'inbound', 'putaway-board', fullParams],
    queryFn: async () => {
      const res = await InboundWebController_getPutawayBoard(
        fullParams as InboundWebControllerGetPutawayBoardParams
      ) as unknown
      return extractBoard<PutawayTask>(res, fullParams)
    },
    staleTime: 1000 * 30,
  })
}
