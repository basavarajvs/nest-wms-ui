import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CarrierWebController_findAll,
  CarrierWebController_findById,
  CarrierWebController_create,
  CarrierWebController_update,
  CarrierWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateCarrierDto, UpdateCarrierDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.carriers)) return obj.carriers as T[]
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

export interface Carrier {
  id: string
  carrierCode: string
  name: string
  scac?: string
  phone?: string
  website?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export function useCarriers() {
  return useQuery({
    queryKey: ['wms', 'carriers', 'list'],
    queryFn: async () => {
      const res = await CarrierWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      carriers: safeArray<Carrier>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCarrier(id: string) {
  return useQuery({
    queryKey: ['wms', 'carriers', 'detail', id],
    queryFn: async () => {
      const res = await CarrierWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Carrier>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateCarrier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCarrierDto) => CarrierWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'carriers'] })
    },
  })
}

export function useUpdateCarrier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCarrierDto }) => CarrierWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'carriers'] })
    },
  })
}

export function useDeleteCarrier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CarrierWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'carriers'] })
    },
  })
}
