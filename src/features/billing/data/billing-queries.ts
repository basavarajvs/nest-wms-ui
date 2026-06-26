import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BillingWebController_createRate,
  BillingWebController_listRates,
  BillingWebController_setClientRate,
  BillingWebController_createCycle,
  BillingWebController_listCycles,
  BillingWebController_generateSnapshot,
  BillingWebController_listSnapshots,
  BillingWebController_calculateCharges,
  BillingWebController_listCharges,
  BillingWebController_generateInvoice,
  BillingWebController_listInvoices,
  BillingWebController_getInvoice,
  BillingWebController_updateInvoiceStatus,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateRateDto,
  CreateClientRateDto,
  CreateBillingCycleDto,
  GenerateSnapshotDto,
  CalculateChargesDto,
  GenerateInvoiceDto,
  UpdateInvoiceStatusDto,
  BillingWebControllerListRatesParams,
  BillingWebControllerListCyclesParams,
  BillingWebControllerListSnapshotsParams,
  BillingWebControllerListChargesParams,
  BillingWebControllerListInvoicesParams,
} from '@/lib/types/wms-api'

export interface StorageRate {
  id: string
  rateCode: string
  rateName: string
  rateType: string
  calculationBasis: string
  defaultRate: number
  currency?: string
  minCharge?: number
  maxCharge?: number
  effectiveDate?: string
  expiryDate?: string
  facilityId: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface ClientRate {
  id: string
  rateMasterId: string
  clientId: string
  clientName?: string
  negotiatedRate: number
  effectiveDate?: string
  expiryDate?: string
  createdAt: string
}

export interface BillingCycle {
  id: string
  cycleCode: string
  cycleName: string
  facilityId: string
  frequency: string
  billingDay: number
  isActive: boolean
  createdAt: string
}

export interface StorageSnapshot {
  id: string
  facilityId: string
  clientId: string
  clientName?: string
  snapshotDate: string
  totalPallets?: number
  totalSqft?: number
  totalCubicFt?: number
  status: string
  createdAt: string
}

export interface StorageCharge {
  id: string
  facilityId: string
  clientId?: string
  clientName?: string
  cycleId?: string
  snapshotId?: string
  chargeType: string
  quantity: number
  rateApplied: number
  chargeAmount: number
  currency?: string
  periodStart?: string
  periodEnd?: string
  status: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber?: string
  facilityId: string
  clientId: string
  clientName?: string
  periodStart: string
  periodEnd: string
  subtotal: number
  taxAmount?: number
  discountAmount?: number
  totalAmount: number
  currency?: string
  status: string
  dueDate?: string
  paidAt?: string
  notes?: string
  createdAt: string
  lines?: InvoiceLine[]
}

export interface InvoiceLine {
  id: string
  invoiceId: string
  lineType: string
  description?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  createdAt: string
}

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
    if (Array.isArray(obj.rates)) return obj.rates as T[]
    if (Array.isArray(obj.cycles)) return obj.cycles as T[]
    if (Array.isArray(obj.snapshots)) return obj.snapshots as T[]
    if (Array.isArray(obj.charges)) return obj.charges as T[]
    if (Array.isArray(obj.invoices)) return obj.invoices as T[]
    if (Array.isArray(obj.lines)) return obj.lines as T[]
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

export function useRateList(params?: Partial<BillingWebControllerListRatesParams>) {
  const qp = { facilityId: params?.facilityId || '', rateType: params?.rateType || '', isActive: params?.isActive || '' }
  return useQuery({
    queryKey: ['wms', 'billing', 'rates', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await BillingWebController_listRates(p as BillingWebControllerListRatesParams)
      return res as unknown
    },
    select: (data) => ({ rates: safeArray<StorageRate>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useCreateRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateRateDto) => BillingWebController_createRate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'rates'] }),
  })
}

export function useSetClientRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateClientRateDto) => BillingWebController_setClientRate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing'] }),
  })
}

export function useBillingCycleList(params?: Partial<BillingWebControllerListCyclesParams>) {
  const qp = { facilityId: params?.facilityId || '' }
  return useQuery({
    queryKey: ['wms', 'billing', 'cycles', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await BillingWebController_listCycles(p as BillingWebControllerListCyclesParams)
      return res as unknown
    },
    select: (data) => ({ cycles: safeArray<BillingCycle>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useCreateBillingCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateBillingCycleDto) => BillingWebController_createCycle(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'cycles'] }),
  })
}

export function useSnapshotList(params?: Partial<BillingWebControllerListSnapshotsParams>) {
  const qp = { facilityId: params?.facilityId || '', snapshotDate: params?.snapshotDate || '', clientId: params?.clientId || '' }
  return useQuery({
    queryKey: ['wms', 'billing', 'snapshots', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await BillingWebController_listSnapshots(p as BillingWebControllerListSnapshotsParams)
      return res as unknown
    },
    select: (data) => ({ snapshots: safeArray<StorageSnapshot>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useGenerateSnapshot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateSnapshotDto) => BillingWebController_generateSnapshot(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'snapshots'] }),
  })
}

export function useChargeList(params?: Partial<BillingWebControllerListChargesParams>) {
  const qp = { facilityId: params?.facilityId || '', clientId: params?.clientId || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'billing', 'charges', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await BillingWebController_listCharges(p as BillingWebControllerListChargesParams)
      return res as unknown
    },
    select: (data) => ({ charges: safeArray<StorageCharge>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useCalculateCharges() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CalculateChargesDto) => BillingWebController_calculateCharges(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'charges'] }),
  })
}

export function useInvoiceList(params?: Partial<BillingWebControllerListInvoicesParams>) {
  const qp = { facilityId: params?.facilityId || '', clientId: params?.clientId || '', status: params?.status || '' }
  return useQuery({
    queryKey: ['wms', 'billing', 'invoices', 'list', qp],
    queryFn: async ({ queryKey }) => {
      const [, , , , p] = queryKey
      const res = await BillingWebController_listInvoices(p as BillingWebControllerListInvoicesParams)
      return res as unknown
    },
    select: (data) => ({ invoices: safeArray<Invoice>(data), total: safeTotal(data) }),
    staleTime: 1000 * 30,
  })
}

export function useGenerateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: GenerateInvoiceDto) => BillingWebController_generateInvoice(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'invoices'] }),
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['wms', 'billing', 'invoices', 'detail', id],
    queryFn: async () => {
      const res = await BillingWebController_getInvoice(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInvoiceStatusDto }) =>
      BillingWebController_updateInvoiceStatus(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wms', 'billing', 'invoices'] }),
  })
}
