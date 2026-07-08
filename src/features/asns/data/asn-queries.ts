import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { useFacilityStore } from '@/stores/facility-store'
import {
  AsnController_findAll,
  AsnController_findById,
  AsnController_findLines,
  AsnController_create,
  AsnController_update,
  AsnController_delete,
} from '@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices'
import { ClientController_findAll } from '@/lib/wms-api/api/wms-api/clients/clients'
import { VendorController_findAll } from '@/lib/wms-api/api/wms-api/vendors/vendors'
import { ProductController_findAll } from '@/lib/wms-api/api/wms-api/products/products'
import { UomController_findAll } from '@/lib/wms-api/api/wms-api/units-of-measure/units-of-measure'
import { FacilityController_findAll } from '@/lib/wms-api/api/wms-api/warehouse-facilities/warehouse-facilities'
import type { AdvanceShipNoticeDto, CreateAsnDto, UpdateAsnDto, ClientResponseDto, VendorResponseDto, ProductResponseDto, UomResponseDto, FacilityResponseDto } from '@/lib/wms-api/types/wms-api'
import type { AsnQueryParams, Envelope } from '@/features/asns/types/asn'

const keys = {
  all: ['wms', 'asns'] as const,
  list: (params?: AsnQueryParams) => ['wms', 'asns', 'list', params] as const,
  detail: (id: string) => ['wms', 'asns', id] as const,
  lines: (id: string) => ['wms', 'asns', id, 'lines'] as const,
}

export function useAsnsList(params?: AsnQueryParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: async () => {
      const res = (await AsnController_findAll({
        params: { page: params?.page, limit: params?.limit, search: params?.search, status: params?.status },
      } as RequestInit)) as unknown as Envelope<{ data: AdvanceShipNoticeDto[]; total: number; page: number; limit: number }>
      return { data: res.data?.data ?? [], total: res.data?.total ?? 0, page: res.data?.page ?? 1, limit: res.data?.limit ?? 20 }
    },
  })
}

export function useAsnById(id: string) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: async () => {
      const res = (await AsnController_findById(id)) as unknown as Envelope<AdvanceShipNoticeDto>
      return res.data as AdvanceShipNoticeDto
    },
    enabled: !!id,
  })
}

export function useAsnLines(asnId: string) {
  return useQuery({
    queryKey: keys.lines(asnId),
    queryFn: async () => {
      const res = (await AsnController_findLines(asnId)) as unknown as Envelope<{ data: AdvanceShipNoticeDto[] }>
      return (res.data as unknown as { data: AdvanceShipNoticeDto[] })?.data ?? []
    },
    enabled: !!asnId,
  })
}

export function useCreateAsn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAsnDto) => {
      const res = (await AsnController_create(data)) as unknown as Envelope<AdvanceShipNoticeDto>
      return res.data as AdvanceShipNoticeDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('ASN created')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useUpdateAsn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAsnDto }) => {
      const res = (await AsnController_update(id, data)) as unknown as Envelope<AdvanceShipNoticeDto>
      return res.data as AdvanceShipNoticeDto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('ASN updated')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useDeleteAsn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await AsnController_delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      toast.success('ASN deleted')
    },
    onError: (error) => handleServerError(error),
  })
}

export function useVendorsForLookup() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'vendors'],
    queryFn: async () => {
      const res = (await VendorController_findAll()) as unknown as Envelope<{ data: VendorResponseDto[]; total: number }>
      return res.data?.data ?? []
    },
  })
}

export function useProductsForLookup() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'products'],
    queryFn: async () => {
      const res = (await ProductController_findAll({ params: { limit: 500 } } as RequestInit)) as unknown as Envelope<{ data: ProductResponseDto[]; total: number }>
      return res.data?.data ?? []
    },
  })
}

export function useUomsForLookup() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'uoms'],
    queryFn: async () => {
      const res = (await UomController_findAll()) as unknown as Envelope<UomResponseDto[]>
      return res.data ?? []
    },
  })
}

export function useFacilitiesForLookup() {
  return useQuery({
    queryKey: ['wms', 'lookup', 'facilities'],
    queryFn: async () => {
      const res = (await FacilityController_findAll()) as unknown as Envelope<{ data: FacilityResponseDto[]; total: number }>
      return res.data?.data ?? []
    },
  })
}

export function useClientsForLookup(facilityCode?: string) {
  const storeCode = useFacilityStore((s) => s.selectedFacility?.code)
  const code = facilityCode ?? storeCode ?? localStorage.getItem('facility_code')
  return useQuery({
    queryKey: ['wms', 'lookup', 'clients', code],
    queryFn: async () => {
      const res = (await ClientController_findAll()) as unknown as Envelope<{ data: ClientResponseDto[]; total: number }>
      return res.data?.data ?? []
    },
  })
}

export const ASN_STATUS_OPTIONS = [
  { value: 'CREATED', label: 'Created' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'ARRIVED', label: 'Arrived' },
  { value: 'IN_RECEIVING', label: 'In Receiving' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export const ASN_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  ASN_STATUS_OPTIONS.map((opt) => [opt.value, opt.label]),
)
