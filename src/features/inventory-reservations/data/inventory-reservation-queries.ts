import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InventoryReservationsWebController_findAll,
  InventoryReservationsWebController_findById,
  InventoryReservationsWebController_create,
  InventoryReservationsWebController_update,
  InventoryReservationsWebController_delete,
  InventoryReservationsWebController_release,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateReservationDto, UpdateReservationDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.reservations)) return obj.reservations as T[]
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

export interface InventoryReservation {
  id: string
  facilityId: string
  productId: string
  locationId: string
  lotId?: string
  quantity: number
  uomId: string
  reservationType: string
  referenceType: string
  referenceId: string
  expiresAt?: string
  status?: string
  createdAt?: string
}

export function useInventoryReservations() {
  return useQuery({
    queryKey: ['wms', 'inventory-reservations', 'list'],
    queryFn: async () => {
      const res = await InventoryReservationsWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      reservations: safeArray<InventoryReservation>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useInventoryReservation(id: string) {
  return useQuery({
    queryKey: ['wms', 'inventory-reservations', 'detail', id],
    queryFn: async () => {
      const res = await InventoryReservationsWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useCreateInventoryReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateReservationDto) => InventoryReservationsWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory-reservations'] })
    },
  })
}

export function useUpdateInventoryReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateReservationDto }) => InventoryReservationsWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory-reservations'] })
    },
  })
}

export function useDeleteInventoryReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => InventoryReservationsWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory-reservations'] })
    },
  })
}

export function useReleaseInventoryReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => InventoryReservationsWebController_release(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inventory-reservations'] })
    },
  })
}
