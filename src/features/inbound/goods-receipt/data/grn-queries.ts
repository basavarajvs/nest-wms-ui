import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  InboundWebController_createGrnFromAsn,
  InboundWebController_createGrnAdHoc,
  InboundWebController_getGrnProgress,
  InboundWebController_markArrived,
  InboundWebController_startReceiving,
  InboundWebController_markReceived,
  InboundWebController_startInspection,
  InboundWebController_completeInspection,
  InboundWebController_cancelGrn,
} from '@/lib/api/wms-api/wms-web/wms-web'
import type {
  CreateGrnFromAsnDto,
  CreateGrnAdHocDto,
  MarkGrnArrivedDto,
  CompleteInspectionDto,
} from '@/lib/types/wms-api'

export function useCreateGrnFromAsn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateGrnFromAsnDto) => {
      return InboundWebController_createGrnFromAsn(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCreateGrnAdHoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: CreateGrnAdHocDto) => {
      return InboundWebController_createGrnAdHoc(dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useGrnProgress(id: string) {
  return useQuery({
    queryKey: ['wms', 'inbound', 'grn', 'progress', id],
    queryFn: async () => {
      const res = await InboundWebController_getGrnProgress(id)
      return res as unknown
    },
    enabled: !!id,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

export const useGetGrnProgress = useGrnProgress

// GRN status transition mutations
export function useMarkGrnArrived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: { receiptNumber: string; dto: MarkGrnArrivedDto }) => {
      return InboundWebController_markArrived(params.receiptNumber, params.dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useStartReceiving() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_startReceiving(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useMarkGrnReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_markReceived(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useStartInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_startInspection(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: { receiptNumber: string; dto: CompleteInspectionDto }) => {
      return InboundWebController_completeInspection(args.receiptNumber, args.dto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}

export function useCancelGrn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (receiptNumber: string) => {
      return InboundWebController_cancelGrn(receiptNumber)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'grn'] })
    },
  })
}
