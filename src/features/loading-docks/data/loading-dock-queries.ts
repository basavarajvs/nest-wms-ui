import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LoadingDocksWebController_findAll,
  LoadingDocksWebController_findById,
  LoadingDocksWebController_create,
  LoadingDocksWebController_update,
  LoadingDocksWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateLoadingDockDto, UpdateLoadingDockDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.loadingDocks)) return obj.loadingDocks as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    return safeArray(data).length || fallback
  }
  return fallback
}

export interface LoadingDock {
  id: string
  dockCode: string
  dockName?: string
  dockType?: string
  facilityId: string
  locationId?: string
  description?: string
  hasLeveler?: boolean
  hasSealant?: boolean
  maxTrailerHeight?: number
  maxTrailerLength?: number
  isAvailable?: boolean
  isActive?: boolean
  createdAt?: string
}

export function useLoadingDocks() {
  return useQuery({
    queryKey: ['wms', 'loading-docks', 'list'],
    queryFn: async () => {
      const res = await LoadingDocksWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      loadingDocks: safeArray<LoadingDock>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useLoadingDock(id: string) {
  return useQuery({
    queryKey: ['wms', 'loading-docks', 'detail', id],
    queryFn: async () => {
      const res = await LoadingDocksWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateLoadingDock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateLoadingDockDto) => LoadingDocksWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loading-docks'] })
    },
  })
}

export function useUpdateLoadingDock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLoadingDockDto }) => LoadingDocksWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loading-docks'] })
    },
  })
}

export function useDeleteLoadingDock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => LoadingDocksWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'loading-docks'] })
    },
  })
}
