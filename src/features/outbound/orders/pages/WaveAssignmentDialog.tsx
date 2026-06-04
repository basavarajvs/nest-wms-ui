import { useState } from 'react'
import { Loader2, Waves } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateWave, useWaveBoard } from '@/features/outbound/waves/data/wave-queries'

interface WaveAssignmentDialogProps {
  orderId: string
  orderNumber?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaveAssignmentDialog({
  orderId,
  orderNumber,
  open,
  onOpenChange,
}: WaveAssignmentDialogProps) {
  const { selectedFacility } = useFacility()
  const createWave = useCreateWave()
  const { data: existingWaves, isLoading: wavesLoading } = useWaveBoard({
    facilityId: selectedFacility?.id,
  })

  const [waveName, setWaveName] = useState('')

  const existingWaveCount = existingWaves?.length ?? 0

  const handleAssign = async () => {
    if (!selectedFacility) {
      toast.error('No facility selected.')
      return
    }
    try {
      await createWave.mutateAsync({
        facilityId: selectedFacility.id,
        orderIds: [orderId],
      })
      toast.success(
        `Order ${orderNumber || orderId} assigned to new wave`
      )
      onOpenChange(false)
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to create wave'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle>Assign to Wave</DialogTitle>
          <DialogDescription>
            Order {orderNumber || orderId} will be assigned to a new wave.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          {wavesLoading ? (
            <div className='flex items-center justify-center py-6'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <div className='rounded-md border p-3'>
              <p className='text-sm text-muted-foreground'>
                Existing waves in facility:{' '}
                <span className='font-medium'>{existingWaveCount}</span>
              </p>
              {existingWaveCount > 0 && (
                <p className='mt-1 text-xs text-muted-foreground'>
                  A new wave will be created with this order. Use the Wave
                  Board to manage all waves.
                </p>
              )}
            </div>
          )}
          <div className='grid gap-2'>
            <Label htmlFor='waveName'>Wave Name (optional)</Label>
            <Input
              id='waveName'
              placeholder='e.g. Wave-2026-001'
              value={waveName}
              onChange={(e) => setWaveName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={createWave.isPending}
          >
            {createWave.isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <Waves className='mr-2 h-4 w-4' />
                Create Wave & Assign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
