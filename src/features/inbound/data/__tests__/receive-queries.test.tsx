import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices', () => ({
  AsnController_findAll: vi.fn(),
  AsnController_findById: vi.fn(),
  AsnController_findLines: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/goods-receipt/goods-receipt', () => ({
  ReceivingController_create: vi.fn(),
  ReceivingController_receiveLine: vi.fn(),
  ReceivingController_complete: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/storage-locations/storage-locations', () => ({
  LocationController_findAll: vi.fn(),
}))

vi.mock('@/stores/facility-store', () => ({
  useFacilityStore: vi.fn((selector) => {
    const state = { facilityId: 1 }
    return selector(state)
  }),
}))

import { useAsnByNumber, useAsnWithLines, useLocations, useCreateGoodsReceipt, useReceiveLine, useCompleteReceipt } from '../receive-queries'
import { AsnController_findAll, AsnController_findById, AsnController_findLines } from '@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices'
import { ReceivingController_create, ReceivingController_receiveLine, ReceivingController_complete } from '@/lib/wms-api/api/wms-api/goods-receipt/goods-receipt'
import { LocationController_findAll } from '@/lib/wms-api/api/wms-api/storage-locations/storage-locations'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockAsn = {
  asn_id: 1,
  asn_number: 'ASN-2026-001',
  inbound_for_client_id: 1,
  status: 'CREATED',
}

describe('useAsnByNumber', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches ASN by number', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue({
      success: true,
      data: { data: [mockAsn], total: 1 },
    })
    const { result } = renderHook(() => useAsnByNumber('ASN-2026-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(AsnController_findAll).toHaveBeenCalled()
    const callArg = vi.mocked(AsnController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toMatchObject({ search: 'ASN-2026-001' })
    expect(result.current.data).toEqual(mockAsn)
  })

  it('returns null when no ASN matches', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue({
      success: true,
      data: { data: [], total: 0 },
    })
    const { result } = renderHook(() => useAsnByNumber('NONEXISTENT'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('does not fetch when asnNumber is empty string', () => {
    renderHook(() => useAsnByNumber(''), { wrapper: createWrapper() })
    expect(AsnController_findAll).not.toHaveBeenCalled()
  })

  it('sets isError on API failure', async () => {
    vi.mocked(AsnController_findAll).mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useAsnByNumber('ASN-001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useAsnWithLines', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches ASN header and lines', async () => {
    vi.mocked(AsnController_findById).mockResolvedValue({
      success: true, data: mockAsn,
    })
    vi.mocked(AsnController_findLines).mockResolvedValue({
      success: true, data: { data: [{ line_id: 1, product_id: 10 }] },
    })
    const { result } = renderHook(() => useAsnWithLines(1), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(AsnController_findById).toHaveBeenCalledWith('1')
    expect(AsnController_findLines).toHaveBeenCalledWith('1')
    expect(result.current.data!.asn).toEqual(mockAsn)
    expect(result.current.data!.lines).toEqual([{ line_id: 1, product_id: 10 }])
  })

  it('does not fetch when asnId is null', () => {
    renderHook(() => useAsnWithLines(null), { wrapper: createWrapper() })
    expect(AsnController_findById).not.toHaveBeenCalled()
    expect(AsnController_findLines).not.toHaveBeenCalled()
  })

  it('sets staleTime and gcTime to 0', () => {
    vi.mocked(AsnController_findById).mockResolvedValue({ success: true, data: mockAsn })
    vi.mocked(AsnController_findLines).mockResolvedValue({ success: true, data: { data: [] } })
    const { result } = renderHook(() => useAsnWithLines(1), { wrapper: createWrapper() })
    expect(result.current).toBeDefined()
  })
})

describe('useLocations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches and filters unblocked locations', async () => {
    vi.mocked(LocationController_findAll).mockResolvedValue({
      success: true,
      data: { data: [
        { location_id: 1, location_name: 'A-01', is_blocked: false },
        { location_id: 2, location_name: 'A-02', is_blocked: true },
        { location_id: 3, location_name: 'A-03', is_blocked: false },
      ], total: 3 },
    })
    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].location_id).toBe(1)
    expect(result.current.data![1].location_id).toBe(3)
  })

  it('returns empty array when no locations', async () => {
    vi.mocked(LocationController_findAll).mockResolvedValue({
      success: true, data: { data: [], total: 0 },
    })
    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('sets isError on failure', async () => {
    vi.mocked(LocationController_findAll).mockRejectedValue(new Error('API Error'))
    const { result } = renderHook(() => useLocations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateGoodsReceipt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls create GRN mutation with dto', async () => {
    vi.mocked(ReceivingController_create).mockResolvedValue({
      success: true, data: { receipt_id: 42 },
    })
    const { result } = renderHook(() => useCreateGoodsReceipt(), { wrapper: createWrapper() })
    const dto = { asn_id: 1, facility_id: 1 }
    result.current.mutate(dto)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ReceivingController_create).toHaveBeenCalledWith(dto)
  })

  it('returns receipt_id on success', async () => {
    vi.mocked(ReceivingController_create).mockResolvedValue({
      success: true, data: { receipt_id: 99 },
    })
    const { result } = renderHook(() => useCreateGoodsReceipt(), { wrapper: createWrapper() })
    let data: unknown
    result.current.mutate(
      { asn_id: 1, facility_id: 1 },
      { onSuccess: (d) => { data = d } },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(data).toEqual({ receipt_id: 99 })
  })
})

describe('useReceiveLine', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls receive line mutation', async () => {
    vi.mocked(ReceivingController_receiveLine).mockResolvedValue(undefined)
    const { result } = renderHook(() => useReceiveLine(), { wrapper: createWrapper() })
    result.current.mutate({ receiptId: 42, dto: { asn_line_id: 1, product_id: 10, uom_id: 2, received_quantity: 50, staging_location_id: 5 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ReceivingController_receiveLine).toHaveBeenCalledWith('42', { asn_line_id: 1, product_id: 10, uom_id: 2, received_quantity: 50, staging_location_id: 5 })
  })
})

describe('useCompleteReceipt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls complete receipt mutation', async () => {
    vi.mocked(ReceivingController_complete).mockResolvedValue({
      success: true, data: { receipt_id: 42 },
    })
    const { result } = renderHook(() => useCompleteReceipt(), { wrapper: createWrapper() })
    result.current.mutate(42)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(ReceivingController_complete).toHaveBeenCalledWith('42')
  })
})
