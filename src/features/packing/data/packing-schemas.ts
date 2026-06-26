import * as z from 'zod'

export const startSessionSchema = z.object({
  stationCode: z.string().min(1, 'Station code is required'),
})

export type StartSessionFormValues = z.infer<typeof startSessionSchema>

export const scanItemSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  lpn: z.string().optional(),
  containerId: z.string().optional(),
})

export type ScanItemFormValues = z.infer<typeof scanItemSchema>

export const sealContainerSchema = z.object({
  containerId: z.string().min(1, 'Container ID is required'),
  weight: z.coerce.number().min(0).optional(),
})

export type SealContainerFormValues = z.infer<typeof sealContainerSchema>

export const SESSION_STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  open: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
}

export const CONTAINER_STATUS_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  open: 'secondary',
  sealed: 'default',
}
