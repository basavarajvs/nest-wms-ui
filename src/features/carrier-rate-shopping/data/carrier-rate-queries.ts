import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CarrierRateShoppingWebController_findRates,
  CarrierRateShoppingWebController_compareRates,
  CarrierRateShoppingWebController_getQuote,
  CarrierRateShoppingWebController_createRate,
  CarrierRateShoppingWebController_deleteRate,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type { CreateCarrierRateDto, RateQuoteRequestDto } from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.rates)) return obj.rates as T[]
    if (Array.isArray(obj.quotes)) return obj.quotes as T[]
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

export interface CarrierRate {
  id: string
  carrierId: string
  carrierName?: string
  serviceLevel?: string
  rate?: number
  currency?: string
  transitDays?: number
  effectiveDate?: string
  expiryDate?: string
}

export function useCarrierRates() {
  return useQuery({
    queryKey: ['wms', 'carrier-rates', 'list'],
    queryFn: async () => {
      const res = await CarrierRateShoppingWebController_findRates()
      return res as unknown
    },
    select: (data) => ({
      rates: safeArray<CarrierRate>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCompareCarrierRates(params: any) {
  return useQuery({
    queryKey: ['wms', 'carrier-rates', 'compare', JSON.stringify(params)],
    queryFn: async () => {
      const res = await CarrierRateShoppingWebController_compareRates(params)
      return res as unknown
    },
    select: (data) => safeArray<CarrierRate>(data),
    staleTime: 1000 * 30,
  })
}

export function useCreateCarrierRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCarrierRateDto) => CarrierRateShoppingWebController_createRate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'carrier-rates'] })
    },
  })
}

export function useDeleteCarrierRate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => CarrierRateShoppingWebController_deleteRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'carrier-rates'] })
    },
  })
}

export function useGetCarrierQuote() {
  return useMutation({
    mutationFn: (dto: RateQuoteRequestDto) => CarrierRateShoppingWebController_getQuote(dto),
  })
}
