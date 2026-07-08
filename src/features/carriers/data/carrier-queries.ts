import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  CarrierController_findAll,
  CarrierController_findById,
  CarrierController_create,
  CarrierController_update,
  CarrierController_delete,
} from '@/lib/wms-api/api/wms-api/carriers/carriers'
import type { CarrierResponseDto } from '@/lib/wms-api/types/wms-api'

interface Envelope<T> {
  success: boolean
  data: T
}

interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

const keys = {
  all: ['wms', 'carriers'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) => ['wms', 'carriers', 'list', params] as const,
  detail: (id: number) => ['wms', 'carriers', id] as const,
}

export function useCarriersList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await CarrierController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search },
      } as RequestInit)) as unknown as Envelope<PaginatedData<CarrierResponseDto>>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0 }
    },
  })
}

export function useCarrier(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await CarrierController_findById(String(id))) as unknown as Envelope<CarrierResponseDto>
      return res.data as CarrierResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      carrier_code: string
      carrier_name: string
      description?: string
      is_active?: boolean
    }) => {
      const res = (await CarrierController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<CarrierResponseDto>
      return res.data as CarrierResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Carrier created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      carrier_id: number
      carrier_code: string
      carrier_name: string
      description?: string
      is_active?: boolean
    }) => {
      const { carrier_id, ...body } = data
      const res = (await CarrierController_update(String(carrier_id), {
        body,
      } as RequestInit)) as unknown as Envelope<CarrierResponseDto>
      return res.data as CarrierResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Carrier updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteCarrier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await CarrierController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Carrier deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
