import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { showSuccess } from '@/lib/toast'
import {
  FacilityController_findAll,
  FacilityController_findById,
  FacilityController_create,
  FacilityController_update,
  FacilityController_delete,
} from '@/lib/wms-api/api/wms-api/warehouse-facilities/warehouse-facilities'
import type { FacilityResponseDto } from '@/lib/wms-api/types/wms-api'

export type Facility = FacilityResponseDto & {
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state_province?: string | null
  postal_code?: string | null
  country_code?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  timezone_name?: string
  default_uom_id?: number | null
}

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
  all: ['wms', 'facilities'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) => ['wms', 'facilities', 'list', params] as const,
  detail: (id: number) => ['wms', 'facilities', id] as const,
}

export function useFacilitiesList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await FacilityController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search },
      } as RequestInit)) as unknown as Envelope<PaginatedData<Facility>>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0 }
    },
  })
}

export function useFacility(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await FacilityController_findById(String(id))) as unknown as Envelope<Facility>
      return res.data as Facility
    },
    enabled: !!id,
  })
}

export function useCreateFacility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      facility_code: string
      facility_name: string
      facility_type?: string
      description?: string
      address_line1?: string
      address_line2?: string
      city?: string
      state_province?: string
      postal_code?: string
      country_code?: string
      contact_person?: string
      contact_phone?: string
      contact_email?: string
      timezone_name?: string
      is_active?: boolean
    }) => {
      const res = (await FacilityController_create(data)) as unknown as Envelope<Facility>
      return res.data as Facility
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Facility created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateFacility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      facility_id: number
      facility_code: string
      facility_name: string
      facility_type?: string
      description?: string
      address_line1?: string
      address_line2?: string
      city?: string
      state_province?: string
      postal_code?: string
      country_code?: string
      contact_person?: string
      contact_phone?: string
      contact_email?: string
      timezone_name?: string
      is_active?: boolean
    }) => {
      const { facility_id, ...body } = data
      const res = (await FacilityController_update(String(facility_id), body)) as unknown as Envelope<Facility>
      return res.data as Facility
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Facility updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteFacility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await FacilityController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      showSuccess('Facility deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
