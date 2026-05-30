import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  VendorWebController_findAll,
  VendorWebController_findById,
  VendorWebController_create,
  VendorWebController_update,
  VendorWebController_delete,
  VendorContactWebController_findByVendorId,
  VendorContactWebController_create,
  VendorContactWebController_update,
  VendorContactWebController_delete,
  VendorAddressWebController_findByVendorId,
  VendorAddressWebController_create,
  VendorAddressWebController_update,
  VendorAddressWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateVendorDto,
  UpdateVendorDto,
  CreateVendorContactDto,
  UpdateVendorContactDto,
  CreateVendorAddressDto,
  UpdateVendorAddressDto,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.vendors)) return obj.vendors as T[]
    if (Array.isArray(obj.contacts)) return obj.contacts as T[]
    if (Array.isArray(obj.addresses)) return obj.addresses as T[]
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

export interface Vendor {
  id: string
  vendorCode: string
  name: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface VendorContact {
  id: string
  vendorId: string
  name: string
  email?: string
  phone?: string
  role?: string
}

export interface VendorAddress {
  id: string
  vendorId: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  addressType?: string
}

export function useVendors(params?: { page?: number; limit?: number; search?: string }) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'vendors', 'list', stableKey],
    queryFn: async () => {
      const res = await VendorWebController_findAll()
      return res as unknown
    },
    select: (data) => ({
      vendors: safeArray<Vendor>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['wms', 'vendors', 'detail', id],
    queryFn: async () => {
      const res = await VendorWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Vendor>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVendorDto) => VendorWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vendors'] })
    },
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVendorDto }) => VendorWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vendors'] })
    },
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => VendorWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'vendors'] })
    },
  })
}
