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
  [key: string]: any
}

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.board)) return obj.board as T[]
    if (Array.isArray(obj.tasks)) return obj.tasks as T[]
  }
  return []
}

export function usePutawayBoard(params: Partial<InboundWebControllerGetPutawayBoardParams> = {}) {
  const fullParams: InboundWebControllerGetPutawayBoardParams = {
    status: params.status || '',
    assignedToUserId: params.assignedToUserId || '',
    priority: params.priority ?? 0,
    page: params.page ?? 1,
    limit: params.limit ?? 50,
  }

  return useQuery({
    queryKey: ['wms', 'inbound', 'putaway-board', fullParams],
    queryFn: async () => {
      const res = await InboundWebController_getPutawayBoard(fullParams as any)
      return res as unknown
    },
    select: (data) => ({
      tasks: safeList<PutawayTask>(data),
      raw: data,
    }),
    staleTime: 1000 * 30,
  })
}
