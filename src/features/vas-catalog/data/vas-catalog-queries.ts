import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  VasCatalogWebController_listServices,
  VasCatalogWebController_createService,
  VasCatalogWebController_updateService,
  VasCatalogWebController_listClientRates,
  VasCatalogWebController_setClientRate,
  VasCatalogWebController_listWorkstations,
  VasCatalogWebController_getWorkstation,
  VasCatalogWebController_createWorkstation,
  VasCatalogWebController_updateWorkstation,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateVasServiceDto,
  UpdateVasServiceDto,
  SetClientRateDto,
  CreateWorkstationDto,
  UpdateWorkstationDto,
  VasCatalogWebControllerListServicesParams,
  VasCatalogWebControllerListClientRatesParams,
  VasCatalogWebControllerListWorkstationsParams,
} from '@/lib/types/wms-api'

export interface VasService {
  id: string
  serviceCode: string
  serviceName: string
  category: string
  description?: string
  defaultRate?: number
  uomId?: string
  estimatedTimeMinutes?: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface VasClientRate {
  id: string
  serviceId: string
  serviceName?: string
  clientId: string
  clientName?: string
  ratePerUnit: number
  currency?: string
  effectiveDate?: string
  expiryDate?: string
  minCharge?: number
  isActive: boolean
  createdAt: string
}

export interface VasWorkstation {
  id: string
  workstationCode: string
  workstationName: string
  stationType: string
  facilityId: string
  locationId?: string
  locationName?: string
  capabilities?: Record<string, unknown>
  isAvailable: boolean
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.services)) return obj.services as T[]
    if (Array.isArray(obj.rates)) return obj.rates as T[]
    if (Array.isArray(obj.workstations)) return obj.workstations as T[]
  }
  return []
}

function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    return safeArray(data).length
  }
  return 0
}

export function useVasServiceList(params?: Partial<VasCatalogWebControllerListServicesParams>) {
  const qp = {
    category: params?.category || '',
    isActive: params?.isActive || '',
  }
  return useQuery({
    queryKey: ['wms', 'vas', 'services', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await VasCatalogWebController_listServices(p as VasCatalogWebControllerListServicesParams)
      return res as unknown
    },
    select: (data) => ({
      services: safeArray<VasService>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useCreateVasService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVasServiceDto) => VasCatalogWebController_createService(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'vas', 'services'] })
    },
  })
}

export function useUpdateVasService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVasServiceDto }) =>
      VasCatalogWebController_updateService(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'vas', 'services'] })
    },
  })
}

export function useVasClientRateList(params?: Partial<VasCatalogWebControllerListClientRatesParams>) {
  const qp = {
    serviceId: params?.serviceId || '',
    clientId: params?.clientId || '',
  }
  return useQuery({
    queryKey: ['wms', 'vas', 'client-rates', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await VasCatalogWebController_listClientRates(p as VasCatalogWebControllerListClientRatesParams)
      return res as unknown
    },
    select: (data) => ({
      rates: safeArray<VasClientRate>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useSetVasClientRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: SetClientRateDto) => VasCatalogWebController_setClientRate(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'vas', 'client-rates'] })
    },
  })
}

export function useVasWorkstationList(params?: Partial<VasCatalogWebControllerListWorkstationsParams>) {
  const qp = {
    facilityId: params?.facilityId || '',
    stationType: params?.stationType || '',
    isAvailable: params?.isAvailable || '',
  }
  return useQuery({
    queryKey: ['wms', 'vas', 'workstations', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await VasCatalogWebController_listWorkstations(p as VasCatalogWebControllerListWorkstationsParams)
      return res as unknown
    },
    select: (data) => ({
      workstations: safeArray<VasWorkstation>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 30,
  })
}

export function useVasWorkstation(id: string) {
  return useQuery({
    queryKey: ['wms', 'vas', 'workstations', 'detail', id],
    queryFn: async () => {
      const res = await VasCatalogWebController_getWorkstation(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useCreateVasWorkstation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWorkstationDto) => VasCatalogWebController_createWorkstation(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'vas', 'workstations'] })
    },
  })
}

export function useUpdateVasWorkstation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkstationDto }) =>
      VasCatalogWebController_updateWorkstation(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wms', 'vas', 'workstations'] })
    },
  })
}
