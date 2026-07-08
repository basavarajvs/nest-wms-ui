import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { handleServerError } from '@/lib/handle-server-error'
import { useFacilityStore } from '@/stores/facility-store'
import {
  AsnController_findAll,
  AsnController_findById,
  AsnController_findLines,
} from '@/lib/wms-api/api/wms-api/advance-ship-notices/advance-ship-notices'
import {
  ReceivingController_create,
  ReceivingController_receiveLine,
  ReceivingController_complete,
} from '@/lib/wms-api/api/wms-api/goods-receipt/goods-receipt'
import { LocationController_findAll } from '@/lib/wms-api/api/wms-api/storage-locations/storage-locations'
import type {
  AdvanceShipNoticeDto,
  AsnLineDto,
  CreateGoodsReceiptDto,
  ReceiveLineDto,
  LocationResponseDto,
} from '@/lib/wms-api/types/wms-api'
import type { Envelope } from '@/features/asns/types/asn'

export function useAsnByNumber(asnNumber: string) {
  return useQuery({
    queryKey: ['wms', 'receiving', 'asn-by-number', asnNumber],
    queryFn: async () => {
      const res = (await AsnController_findAll({
        params: { search: asnNumber, limit: 10 },
      } as RequestInit)) as unknown as Envelope<{ data: AdvanceShipNoticeDto[]; total: number }>
      const items = res.data?.data ?? []
      const match = items.find((a) => a.asn_number === asnNumber)
      return (match ?? null) as AdvanceShipNoticeDto | null
    },
    enabled: asnNumber.length > 0,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useAsnWithLines(asnId: number | null) {
  return useQuery({
    queryKey: ['wms', 'receiving', 'asn-with-lines', asnId],
    queryFn: async () => {
      const res = (await AsnController_findById(String(asnId))) as unknown as Envelope<AdvanceShipNoticeDto>
      const asn = res.data as AdvanceShipNoticeDto
      const linesRes = (await AsnController_findLines(String(asnId))) as unknown as Envelope<{ data: AsnLineDto[] }>
      const lines = (linesRes.data as unknown as { data: AsnLineDto[] })?.data ?? []
      return { asn, lines }
    },
    enabled: asnId !== null,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useLocations() {
  const facilityId = useFacilityStore((s) => s.facilityId)
  return useQuery({
    queryKey: ['wms', 'receiving', 'locations', facilityId],
    queryFn: async () => {
      const res = (await LocationController_findAll({
        params: { facilityId },
      } as RequestInit)) as unknown as Envelope<{ data: LocationResponseDto[]; total: number }>
      const items = res.data?.data ?? []
      return items.filter((loc) => !loc.is_blocked)
    },
    enabled: !!facilityId,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateGoodsReceiptDto) => {
      const res = (await ReceivingController_create(dto)) as unknown as Envelope<{ receipt_id: number }>
      return res.data as { receipt_id: number }
    },
    onError: (error) => handleServerError(error),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'goods-receipts'] })
    },
  })
}

export function useReceiveLine() {
  return useMutation({
    mutationFn: async ({ receiptId, dto }: { receiptId: number; dto: ReceiveLineDto }) => {
      await ReceivingController_receiveLine(String(receiptId), dto)
    },
    onError: (error) => handleServerError(error),
  })
}

export function useCompleteReceipt() {
  return useMutation({
    mutationFn: async (receiptId: number) => {
      const res = (await ReceivingController_complete(
        String(receiptId),
      )) as unknown as Envelope<{ receipt_id: number }>
      return res.data as { receipt_id: number }
    },
    onError: (error) => handleServerError(error),
  })
}
