import type {
  AdvanceShipNoticeDto,
  AsnLineDto,
  AsnListResponseDto,
  CreateAsnDto,
  CreateAsnLineDto,
  UpdateAsnDto,
} from '@/lib/wms-api/types/wms-api'

export type Asn = AdvanceShipNoticeDto
export type AsnLine = AsnLineDto
export type AsnListResponse = AsnListResponseDto
export type CreateAsnPayload = CreateAsnDto
export type CreateAsnLinePayload = CreateAsnLineDto
export type UpdateAsnPayload = UpdateAsnDto

export interface AsnQueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
}

export interface Envelope<T> {
  success: boolean
  data: T
}
