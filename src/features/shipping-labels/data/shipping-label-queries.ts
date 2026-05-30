import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShippingLabelsWebController_findAll,
  ShippingLabelsWebController_findById,
  ShippingLabelsWebController_generate,
  ShippingLabelsWebController_print,
  ShippingLabelsWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { GenerateLabelDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.labels)) return obj.labels as T[]
    if (Array.isArray(obj.shippingLabels)) return obj.shippingLabels as T[]
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

export interface ShippingLabel {
  id: string
  labelType: string
  shipmentId: string
  containerId?: string
  carrierCode?: string
  trackingNumber?: string
  labelUrl?: string
  status?: string
  createdAt?: string
}

export function useShippingLabels() {
  return useQuery({
    queryKey: ['wms', 'shipping-labels', 'list'],
    queryFn: async () => {
      const res = await ShippingLabelsWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      labels: safeArray<ShippingLabel>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useShippingLabel(id: string) {
  return useQuery({
    queryKey: ['wms', 'shipping-labels', 'detail', id],
    queryFn: async () => {
      const res = await ShippingLabelsWebController_findById(id)
      return res as unknown
    },
    enabled: !!id,
  })
}

export function useGenerateShippingLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateLabelDto) => ShippingLabelsWebController_generate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'shipping-labels'] })
    },
  })
}

export function usePrintShippingLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ShippingLabelsWebController_print(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'shipping-labels'] })
    },
  })
}

export function useDeleteShippingLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ShippingLabelsWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'shipping-labels'] })
    },
  })
}
