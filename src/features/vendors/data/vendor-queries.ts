import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import {
  VendorController_findAll,
  VendorController_findById,
  VendorController_create,
  VendorController_update,
  VendorController_delete,
} from '@/lib/wms-api/api/wms-api/vendors/vendors'
import type { VendorResponseDto } from '@/lib/wms-api/types/wms-api'

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
  all: ['wms', 'vendors'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) => ['wms', 'vendors', 'list', params] as const,
  detail: (id: number) => ['wms', 'vendors', id] as const,
}

export function useVendorsList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await VendorController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search },
      } as RequestInit)) as unknown as Envelope<PaginatedData<VendorResponseDto>>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0 }
    },
  })
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await VendorController_findById(String(id))) as unknown as Envelope<VendorResponseDto>
      return res.data as VendorResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      vendor_code: string
      vendor_name: string
      description?: string
      is_active?: boolean
    }) => {
      const res = (await VendorController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<VendorResponseDto>
      return res.data as VendorResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Vendor created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      vendor_id: number
      vendor_code: string
      vendor_name: string
      description?: string
      is_active?: boolean
    }) => {
      const { vendor_id, ...body } = data
      const res = (await VendorController_update(String(vendor_id), {
        body,
      } as RequestInit)) as unknown as Envelope<VendorResponseDto>
      return res.data as VendorResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Vendor updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteVendor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await VendorController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Vendor deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
