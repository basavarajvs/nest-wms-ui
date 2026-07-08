import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices', () => ({
  AsnController_findAll: vi.fn(),
  AsnController_findById: vi.fn(),
  AsnController_findLines: vi.fn(),
  AsnController_create: vi.fn(),
  AsnController_update: vi.fn(),
  AsnController_delete: vi.fn(),
}))

import { useAsnsList, useAsnById, useAsnLines, useCreateAsn, useUpdateAsn, useDeleteAsn } from '../asn-queries'
import { AsnController_findAll, AsnController_findById, AsnController_findLines, AsnController_create, AsnController_update, AsnController_delete } from '@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockAsn = {
  asn_id: '1',
  asn_number: 'ASN-2026-001',
  inbound_for_client_id: 1,
  status: 'CREATED',
}

const mockAsnListResponse = {
  success: true,
  data: {
    data: [mockAsn],
    total: 1,
    page: 1,
    limit: 20,
  },
}

describe('useAsnsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls AsnController_findAll on mount', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue(mockAsnListResponse)

    const { result } = renderHook(() => useAsnsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(AsnController_findAll).toHaveBeenCalledTimes(1)
  })

  it('passes query params to the API', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue(mockAsnListResponse)

    const params = { page: 1, limit: 25, search: 'ASN-2026', status: 'CREATED' }
    renderHook(() => useAsnsList(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(AsnController_findAll).toHaveBeenCalled())

    const callArg = vi.mocked(AsnController_findAll).mock.calls[0][0] as RequestInit
    expect(callArg.params).toEqual({
      page: 1,
      limit: 25,
      search: 'ASN-2026',
      status: 'CREATED',
    })
  })

  it('transforms response into { data, total, page, limit }', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue(mockAsnListResponse)

    const { result } = renderHook(() => useAsnsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(result.current.data!.data).toEqual([mockAsn])
    expect(result.current.data!.total).toBe(1)
    expect(result.current.data!.page).toBe(1)
    expect(result.current.data!.limit).toBe(20)
  })

  it('returns defaults when response data is empty', async () => {
    vi.mocked(AsnController_findAll).mockResolvedValue({
      success: true,
      data: { data: undefined, total: undefined, page: undefined, limit: undefined },
    })

    const { result } = renderHook(() => useAsnsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data!.data).toEqual([])
    expect(result.current.data!.total).toBe(0)
    expect(result.current.data!.page).toBe(1)
    expect(result.current.data!.limit).toBe(20)
  })

  it('sets isError on failure', async () => {
    vi.mocked(AsnController_findAll).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAsnsList(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('starts in loading state', async () => {
    vi.mocked(AsnController_findAll).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAsnsList(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})

describe('useAsnById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches ASN by id', async () => {
    vi.mocked(AsnController_findById).mockResolvedValue({
      success: true,
      data: mockAsn,
    })

    const { result } = renderHook(() => useAsnById('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(AsnController_findById).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual(mockAsn)
  })

  it('does not fetch when id is empty', () => {
    renderHook(() => useAsnById(''), {
      wrapper: createWrapper(),
    })

    expect(AsnController_findById).not.toHaveBeenCalled()
  })
})

describe('useAsnLines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches lines for an ASN', async () => {
    vi.mocked(AsnController_findLines).mockResolvedValue({
      success: true,
      data: { data: [{ line_id: 1, product_id: 10 }] },
    })

    const { result } = renderHook(() => useAsnLines('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(AsnController_findLines).toHaveBeenCalledWith('1')
    expect(result.current.data).toEqual([{ line_id: 1, product_id: 10 }])
  })

  it('returns empty array when no lines', async () => {
    vi.mocked(AsnController_findLines).mockResolvedValue({
      success: true,
      data: null,
    })

    const { result } = renderHook(() => useAsnLines('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('does not fetch when asnId is empty', () => {
    renderHook(() => useAsnLines(''), {
      wrapper: createWrapper(),
    })

    expect(AsnController_findLines).not.toHaveBeenCalled()
  })
})

describe('useCreateAsn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls create mutation with data', async () => {
    vi.mocked(AsnController_create).mockResolvedValue({
      success: true,
      data: mockAsn,
    })

    const { result } = renderHook(() => useCreateAsn(), {
      wrapper: createWrapper(),
    })

    const payload = {
      asn_number: 'ASN-002',
      facility_id: 1,
      inbound_for_client_id: 1,
      lines: [{ product_id: 1, expected_quantity: 10, uom_id: 2 }],
    }

    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(AsnController_create).toHaveBeenCalledWith(payload)
  })
})

describe('useUpdateAsn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls update mutation with id and data', async () => {
    vi.mocked(AsnController_update).mockResolvedValue({
      success: true,
      data: mockAsn,
    })

    const { result } = renderHook(() => useUpdateAsn(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: '1', data: { asn_number: 'ASN-UPDATED', facility_id: 1, inbound_for_client_id: 1 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(AsnController_update).toHaveBeenCalledWith('1', { asn_number: 'ASN-UPDATED', facility_id: 1, inbound_for_client_id: 1 })
  })
})

describe('useDeleteAsn', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls delete with id', async () => {
    vi.mocked(AsnController_delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteAsn(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(AsnController_delete).toHaveBeenCalledWith('1')
  })
})
