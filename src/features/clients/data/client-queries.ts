import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ClientWebController_findAll,
  ClientWebController_findById,
  ClientWebController_create,
  ClientWebController_update,
  ClientWebController_delete,
  ClientContactWebController_findByClientId,
  ClientContactWebController_create,
  ClientContactWebController_update,
  ClientContactWebController_delete,
  ClientAddressWebController_findByClientId,
  ClientAddressWebController_create,
  ClientAddressWebController_update,
  ClientAddressWebController_delete,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateClientDto,
  UpdateClientDto,
  CreateClientContactDto,
  UpdateClientContactDto,
  CreateClientAddressDto,
  UpdateClientAddressDto,
  ClientWebControllerFindAllParams,
} from '@/lib/types/wms-api'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.clients)) return obj.clients as T[]
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

export interface Client {
  id: string
  clientCode: string
  name: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ClientContact {
  id: string
  clientId: string
  name: string
  email?: string
  phone?: string
  role?: string
}

export interface ClientAddress {
  id: string
  clientId: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  addressType?: string
}

export function useClients(params?: ClientWebControllerFindAllParams) {
  const stableKey = JSON.stringify(params)
  return useQuery({
    queryKey: ['wms', 'clients', 'list', stableKey],
    queryFn: async () => {
      const res = await ClientWebController_findAll(params as ClientWebControllerFindAllParams)
      return res as unknown
    },
    select: (data) => ({
      clients: safeArray<Client>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 2,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['wms', 'clients', 'detail', id],
    queryFn: async () => {
      const res = await ClientWebController_findById(id)
      return res as unknown
    },
    select: (data) => {
      const items = safeArray<Client>(data)
      return items[0] ?? null
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateClientDto) => ClientWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateClientDto }) => ClientWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => ClientWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients'] })
    },
  })
}

export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: ['wms', 'clients', 'contacts', clientId],
    queryFn: async () => {
      const res = await ClientContactWebController_findByClientId(clientId)
      return res as unknown
    },
    select: (data) => safeArray<ClientContact>(data),
    enabled: !!clientId,
  })
}

export function useCreateClientContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateClientContactDto) => ClientContactWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'contacts'] })
    },
  })
}

export function useUpdateClientContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateClientContactDto }) => ClientContactWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'contacts'] })
    },
  })
}

export function useDeleteClientContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => ClientContactWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'contacts'] })
    },
  })
}

export function useClientAddresses(clientId: string) {
  return useQuery({
    queryKey: ['wms', 'clients', 'addresses', clientId],
    queryFn: async () => {
      const res = await ClientAddressWebController_findByClientId(clientId)
      return res as unknown
    },
    select: (data) => safeArray<ClientAddress>(data),
    enabled: !!clientId,
  })
}

export function useCreateClientAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateClientAddressDto) => ClientAddressWebController_create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'addresses'] })
    },
  })
}

export function useUpdateClientAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateClientAddressDto }) => ClientAddressWebController_update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'addresses'] })
    },
  })
}

export function useDeleteClientAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => ClientAddressWebController_delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'clients', 'addresses'] })
    },
  })
}
