import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  VasExecutionWebController_findAll,
  VasExecutionWebController_findById,
  VasExecutionWebController_create,
  VasExecutionWebController_update,
  VasExecutionWebController_delete,
  VasExecutionWebController_addEvent,
  VasExecutionWebController_getEvents,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateVasTaskDto, UpdateVasTaskDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.vasTasks)) return obj.vasTasks as T[]
    if (Array.isArray(obj.tasks)) return obj.tasks as T[]
    if (Array.isArray(obj.events)) return obj.events as T[]
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

export interface VasTask {
  id: string
  taskType: string
  facilityId: string
  orderId?: string
  shipmentId?: string
  productId?: string
  quantityRequired?: number
  uomId?: string
  ratePerUnit?: number
  priority?: number
  assignedToUserId?: string
  notes?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

export function useVasTasks() {
  return useQuery({
    queryKey: ['wms', 'vas-tasks', 'list'],
    queryFn: async () => {
      const res = await VasExecutionWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      tasks: safeArray<VasTask>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useVasTask(id: string) {
  return useQuery({
    queryKey: ['wms', 'vas-tasks', 'detail', id],
    queryFn: async () => {
      const res = await VasExecutionWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateVasTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVasTaskDto) => VasExecutionWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vas-tasks'] })
    },
  })
}

export function useUpdateVasTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVasTaskDto }) => VasExecutionWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vas-tasks'] })
    },
  })
}

export function useDeleteVasTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => VasExecutionWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vas-tasks'] })
    },
  })
}

export function useVasTaskEvents(taskId: string) {
  return useQuery({
    queryKey: ['wms', 'vas-tasks', 'events', taskId],
    queryFn: async () => {
      const res = await VasExecutionWebController_getEvents(taskId)
      return res as unknown
    },
    select: (data) => safeArray(data),
    enabled: !!taskId,
  })
}

export function useAddVasTaskEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, dto }: { taskId: string; dto: any }) => {
      return VasExecutionWebController_addEvent(taskId, dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vas-tasks'] })
    },
  })
}
