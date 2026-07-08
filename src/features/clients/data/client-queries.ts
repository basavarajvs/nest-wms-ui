import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import {
  ClientController_findAll,
  ClientController_findById,
  ClientController_create,
  ClientController_update,
  ClientController_delete,
} from '@/lib/wms-api/api/wms-api/clients/clients'
import type { ClientResponseDto } from '@/lib/wms-api/types/wms-api'

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
  all: ['wms', 'clients'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) => ['wms', 'clients', 'list', params] as const,
  detail: (id: number) => ['wms', 'clients', id] as const,
}

export function useClientsList(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await ClientController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search },
      } as RequestInit)) as unknown as Envelope<PaginatedData<ClientResponseDto>>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0 }
    },
  })
}

export function useClient(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await ClientController_findById(String(id))) as unknown as Envelope<ClientResponseDto>
      return res.data as ClientResponseDto
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      client_code: string
      client_name: string
      description?: string
      is_active?: boolean
    }) => {
      const res = (await ClientController_create({
        body: data,
      } as RequestInit)) as unknown as Envelope<ClientResponseDto>
      return res.data as ClientResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Client created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      client_id: number
      client_code: string
      client_name: string
      description?: string
      is_active?: boolean
    }) => {
      const { client_id, ...body } = data
      const res = (await ClientController_update(String(client_id), {
        body,
      } as RequestInit)) as unknown as Envelope<ClientResponseDto>
      return res.data as ClientResponseDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Client updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await ClientController_delete(String(id))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('Client deleted')
    },
    onError: (error) => handleServerError(error),
  })
}
