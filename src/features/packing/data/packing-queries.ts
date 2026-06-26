import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PackingWebController_startSession,
  PackingWebController_scanItem,
  PackingWebController_sealContainer,
  PackingWebController_closeSession,
  PackingWebController_getContainers,
  PackingWebController_getHistory,
  PackingWebController_getShipmentHistory,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { StartSessionDto, ScanItemDto, SealContainerDto } from '@/lib/types/wms-api'

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
  userId?: string
  startedAt?: string
  createdAt?: string
}

export interface HistoryEntry {
  id?: string
  fromStatus?: string
  toStatus?: string
  changedBy?: string
  changedAt?: string
  notes?: string
}

export function useStartPackingSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: StartSessionDto) => {
      const res = await PackingWebController_startSession(dto)
      return res as unknown
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing'] })
    },
  })
}

export function useScanItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, dto }: { sessionId: string; dto: ScanItemDto }) => {
      return PackingWebController_scanItem(sessionId, dto)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing', 'containers', variables.sessionId] })
    },
  })
}

export function useSealContainer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, dto }: { sessionId: string; dto: SealContainerDto }) => {
      return PackingWebController_sealContainer(sessionId, dto)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing', 'containers', variables.sessionId] })
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
      queryClient.invalidateQueries({ queryKey: ['wms', 'packing'] })
    },
  })
}

export function useSessionContainers(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'packing', 'containers', sessionId],
    queryFn: async () => {
      const res = await PackingWebController_getContainers(sessionId!)
      return safeList<PackingContainer>(res)
    },
    enabled: !!sessionId,
    refetchInterval: 15000,
  })
}

export function useSessionHistory(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'packing', 'history', sessionId],
    queryFn: async () => {
      const res = await PackingWebController_getHistory(sessionId!)
      return safeList<HistoryEntry>(res)
    },
    enabled: !!sessionId,
  })
}

export function useShipmentStatusHistory(shipmentId: string | undefined) {
  return useQuery({
    queryKey: ['wms', 'packing', 'shipment-history', shipmentId],
    queryFn: async () => {
      const res = await PackingWebController_getShipmentHistory(shipmentId!)
      return safeList<HistoryEntry>(res)
    },
    enabled: !!shipmentId,
  })
}
