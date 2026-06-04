import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Package, Radio, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useAsnDetail, useUpdateAsnStatus } from '../data/asn-queries'
import { useCreateGrnFromAsn, useGrnProgress } from '@/features/inbound/goods-receipt/data/grn-queries'
import { useGrnLines } from '@/features/inbound/goods-receipt/data/grn-line-queries'
import { GrnLineItemsDialog } from '@/features/inbound/goods-receipt/components/GrnLineItemsDialog'

type ReceivingStep = 'idle' | 'creating-grn' | 'grn-created' | 'in-progress' | 'completed' | 'error'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  in_transit: 'bg-purple-100 text-purple-700 border-purple-200',
  arrived: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

function formatDate(d?: string): string {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return d
  }
}

interface AsnReceivingDialogProps {
  asnId: string
  asnNumber?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AsnReceivingDialog({
  asnId,
  asnNumber,
  open,
  onOpenChange,
}: AsnReceivingDialogProps) {
  const [step, setStep] = useState<ReceivingStep>('idle')
  const [grnId, setGrnId] = useState<string>('')
  const [grnReceiptNumber, setGrnReceiptNumber] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [linesDialogOpen, setLinesDialogOpen] = useState(false)
  const completedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryClient = useQueryClient()
  const { data: asnDetail, isLoading: asnLoading } = useAsnDetail(asnId)
  const updateAsnStatus = useUpdateAsnStatus()
  const createGrn = useCreateGrnFromAsn()
  const shouldPoll = step === 'creating-grn' || step === 'grn-created'
  const { data: progressData } = useGrnProgress(
    shouldPoll ? grnId : '',
    { refetchInterval: shouldPoll ? 2000 : undefined }
  )
  const { data: linesData } = useGrnLines(step === 'in-progress' ? grnId : '')

  const lines = linesData?.lines ?? []
  const totalLines = lines.length
  const completedLines = lines.filter((l) => (l.receivedQuantity ?? 0) > 0).length
  const linesProgress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0

  const reset = useCallback(() => {
    setStep('idle')
    setGrnId('')
    setGrnReceiptNumber('')
    setErrorMessage('')
    setLinesDialogOpen(false)
    if (completedTimerRef.current) {
      clearTimeout(completedTimerRef.current)
      completedTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  useEffect(() => {
    if (shouldPoll) {
      if (progressData && typeof progressData === 'object') {
        const p = progressData as Record<string, unknown>
        const status = String(p.status ?? '').toLowerCase()
        if (status !== 'creating' && status !== '' && status !== 'pending') {
          setStep('grn-created')
        }
      }
    }
  }, [shouldPoll, progressData])

  useEffect(() => {
    if (step === 'completed') {
      completedTimerRef.current = setTimeout(() => {
        onOpenChange(false)
      }, 3000)
    }
    return () => {
      if (completedTimerRef.current) {
        clearTimeout(completedTimerRef.current)
      }
    }
  }, [step, onOpenChange])

  const handleStartReceiving = useCallback(async () => {
    setStep('creating-grn')
    setErrorMessage('')
    try {
      const res = await createGrn.mutateAsync({
        asnNumber: asnNumber ?? asnId,
      } as any)
      let id = ''
      let receiptNumber = ''
      if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>
        id = String(obj.id ?? '')
        receiptNumber = String(obj.receiptNumber ?? obj.grnNumber ?? '')
      }
      if (!id) {
        throw new Error('GRN created but no ID returned')
      }
      setGrnId(id)
      setGrnReceiptNumber(receiptNumber)
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to create GRN')
      setStep('error')
    }
  }, [asnNumber, asnId, createGrn])

  const completeReceiving = useCallback(async () => {
    setStep('completed')
    toast.success('Receiving complete')
    try {
      await updateAsnStatus.mutateAsync({
        id: asnId,
        dto: { status: 'received' },
      })
    } catch {
      // non-blocking — status update failure is informational
    }
    queryClient.invalidateQueries({ queryKey: ['wms', 'inbound', 'putaway-board'] })
  }, [asnId, updateAsnStatus, queryClient])

  const handleContinueToItems = useCallback(() => {
    setStep('in-progress')
    setLinesDialogOpen(true)
  }, [])

  const handleLinesDialogClose = useCallback((open: boolean) => {
    setLinesDialogOpen(open)
    if (!open) {
      if (completedLines >= totalLines && totalLines > 0) {
        completeReceiving()
      }
    }
  }, [completedLines, totalLines, completeReceiving])

  const handleRetry = useCallback(() => {
    setStep('idle')
    setErrorMessage('')
  }, [])

  const isAllReceived = totalLines > 0 && completedLines >= totalLines

  useEffect(() => {
    if (step === 'in-progress' && isAllReceived && !linesDialogOpen) {
      completeReceiving()
    }
  }, [step, isAllReceived, linesDialogOpen, completeReceiving])

  const progressPercent =
    step === 'idle' ? 0
    : step === 'creating-grn' ? 0
    : step === 'grn-created' ? 33
    : step === 'in-progress' ? 33 + Math.round(linesProgress * 0.67)
    : step === 'completed' ? 100
    : 33

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {step === 'idle' && 'Start Receiving'}
              {step === 'creating-grn' && 'Creating GRN...'}
              {step === 'grn-created' && 'GRN Created'}
              {step === 'in-progress' && 'Receive Items'}
              {step === 'completed' && 'Receiving Complete'}
              {step === 'error' && 'Error'}
            </DialogTitle>
            <DialogDescription>
              {step === 'idle' && 'Review ASN details and begin the receiving process'}
              {step === 'creating-grn' && 'Generating goods receipt note from this ASN'}
              {step === 'grn-created' && 'Goods receipt note is ready for receiving'}
              {step === 'in-progress' && 'Enter quantities for each line item'}
              {step === 'completed' && 'All items have been received'}
              {step === 'error' && 'Something went wrong during the receiving process'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    step === 'completed' ? 'bg-green-500' : 'bg-primary'
                  }`}
                  style={{
                    width: step === 'creating-grn' ? '100%' : `${progressPercent}%`,
                    animation: step === 'creating-grn' ? 'progress-indeterminate 1.5s ease-in-out infinite' : undefined,
                  }}
                />
              </div>
              <style>{`
                @keyframes progress-indeterminate {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
              `}</style>
            </div>

            {/* Idle State */}
            {step === 'idle' && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{asnDetail?.asnNumber ?? asnNumber ?? 'ASN'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {asnDetail?.vendorName ?? asnDetail?.supplier ?? 'Unknown vendor'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">PO Number</p>
                    <p className="font-medium">{asnDetail?.poNumber || '-'}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Expected</p>
                    <p className="font-medium">{formatDate(asnDetail?.expectedDate)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Lines</p>
                    <p className="font-medium">{asnDetail?.lines?.length ?? 0} items</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[asnDetail?.status?.toLowerCase() ?? ''] ?? 'bg-gray-100 text-gray-700'}
                    >
                      {asnDetail?.status ? asnDetail.status.charAt(0).toUpperCase() + asnDetail.status.slice(1) : '-'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Creating GRN State */}
            {step === 'creating-grn' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Creating Goods Receipt Note...</p>
              </div>
            )}

            {/* GRN Created State */}
            {step === 'grn-created' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  <Radio className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold">
                      GRN {grnReceiptNumber || grnId.slice(0, 8)}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Goods receipt note has been created from ASN {asnNumber ?? asnId.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click below to start entering received quantities for each line item.
                </p>
              </div>
            )}

            {/* In Progress State */}
            {step === 'in-progress' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                  <span className="text-sm font-medium">Line Items</span>
                  <span className="text-sm text-muted-foreground">
                    {completedLines}/{totalLines} received
                  </span>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {totalLines === 0
                      ? 'No line items found for this GRN'
                      : `Manage line item quantities to track receiving progress`}
                  </p>
                </div>
              </div>
            )}

            {/* Completed State */}
            {step === 'completed' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <h3 className="text-lg font-semibold">Receiving Complete</h3>
                <p className="text-sm text-muted-foreground">
                  All items have been received successfully. This dialog will close automatically.
                </p>
              </div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {step === 'idle' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartReceiving} disabled={asnLoading}>
                  {asnLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Start Receiving
                </Button>
              </>
            )}
            {step === 'creating-grn' && (
              <Button variant="outline" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </Button>
            )}
            {step === 'grn-created' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={handleContinueToItems}>
                  Continue to Receive Items
                </Button>
              </>
            )}
            {step === 'in-progress' && (
              <>
                <Button variant="outline" onClick={() => {
                  if (isAllReceived) {
                    completeReceiving()
                  } else {
                    onOpenChange(false)
                  }
                }}>
                  {isAllReceived ? 'Complete Receiving' : 'Close'}
                </Button>
                <Button onClick={() => setLinesDialogOpen(true)}>
                  Open Line Items
                </Button>
              </>
            )}
            {step === 'completed' && (
              <Button variant="outline" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Complete
              </Button>
            )}
            {step === 'error' && (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={handleRetry}>
                  Retry
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {grnId && (
        <GrnLineItemsDialog
          grnId={grnId}
          open={linesDialogOpen}
          onOpenChange={handleLinesDialogClose}
        />
      )}
    </>
  )
}
