import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PackingWebController_startSession,
  PackingWebController_scanItem,
  PackingWebController_sealContainer,
  PackingWebController_closeSession,
  PackingWebController_getContainers,
  PackingWebController_getHistory,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { StartSessionDto } from '@/lib/types/wms-api/startSessionDto'
import type { ScanItemDto } from '@/lib/types/wms-api/scanItemDto'
import type { SealContainerDto } from '@/lib/types/wms-api/sealContainerDto'

function safeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.containers)) return obj.containers as T[]
    if (Array.isArray(obj.history)) return obj.history as T[]
  }
  return []
}

export interface PackingContainer {
  id: string
  sessionId?: string
  containerCode?: string
  status?: string
  weight?: number
  items?: number
  createdAt?: string
}

export interface PackingSession {
  id: string
  stationCode?: string
  orderId?: string
  status?: string
  createdAt?: string
}

export function useStartSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: StartSessionDto) => {
      return PackingWebController_startSession(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'packing'] })
    },
  })
}

export function useScanItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, dto }: { sessionId: string; dto: ScanItemDto }) => {
      return PackingWebController_scanItem(sessionId, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'packing', 'containers'] })
    },
  })
}

export function useSealContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: SealContainerDto) => {
      return PackingWebController_sealContainer(dto.containerId, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'packing'] })
    },
  })
}

export function useCloseSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return PackingWebController_closeSession(sessionId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'outbound', 'packing'] })
    },
  })
}

export function useContainers(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'outbound', 'packing', 'containers', sessionId],
    queryFn: async () => {
      const res = await PackingWebController_getContainers(sessionId!)
      return safeList<PackingContainer>(res)
    },
    enabled: !!sessionId,
    staleTime: 1000 * 15,
  })
}

export function usePackingHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'outbound', 'packing', 'history', sessionId],
    queryFn: async () => {
      const res = await PackingWebController_getHistory(sessionId!)
      return safeList<any>(res)
    },
    enabled: !!sessionId,
  })
}
