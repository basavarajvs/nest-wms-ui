import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CustomersWebController_findAll,
  CustomersWebController_findById,
  CustomersWebController_create,
  CustomersWebController_update,
  CustomersWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomersWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.customers)) return obj.customers as T[]
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

export interface Customer {
  id: string
  customerCode: string
  name: string
  customerType?: string
  primaryContactName?: string
  primaryEmail?: string
  primaryPhone?: string
  billingAddressLine1?: string
  billingAddressLine2?: string
  billingCity?: string
  billingState?: string
  billingPostalCode?: string
  billingCountry?: string
  shippingAddressLine1?: string
  shippingAddressLine2?: string
  shippingCity?: string
  shippingState?: string
  shippingPostalCode?: string
  shippingCountry?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export function useCustomerList(params?: CustomersWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'customers', 'list', stableKey],
    queryFn: async () => {
      const res = await CustomersWebController_findAll(params as CustomersWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      customers: safeArray<Customer>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['wms', 'customers', 'detail', id],
    queryFn: async () => {
      const res = await CustomersWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Customer>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateCustomerDto) => CustomersWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateCustomerDto }) => CustomersWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customers'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => CustomersWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'customers'] })
    },
  })
}
