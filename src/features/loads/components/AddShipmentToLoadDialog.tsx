import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useAssignShipmentToLoad } from '../data/load-queries'

interface AddShipmentToLoadDialogProps {
  loadId: string
  dockDoorCode?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddShipmentToLoadDialog({
  loadId,
  dockDoorCode,
  open,
  onOpenChange,
}: AddShipmentToLoadDialogProps) {
  const [shipmentId, setShipmentId] = useState('')
  const assignMutation = useAssignShipmentToLoad()

  const handleSubmit = async () => {
    if (!shipmentId.trim()) {
      toast.error('Shipment ID is required.')
      return
    }
    try {
      await assignMutation.mutateAsync({
        loadId,
        shipmentId: shipmentId.trim(),
        dockDoorCode: dockDoorCode || '',
      })
      toast.success('Shipment assigned to load')
      setShipmentId('')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign shipment')
    }
  }

  const handleClose = () => {
    if (!assignMutation.isPending) {
      setShipmentId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogTitle>Add Shipment to Load</DialogTitle>
          <DialogDescription>
            Assign a shipment to this load. Enter the shipment ID below.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-2'>
          <div className='grid gap-2'>
            <Label htmlFor='shipmentId'>Shipment ID</Label>
            <Input
              id='shipmentId'
              value={shipmentId}
              onChange={(e) => setShipmentId(e.target.value)}
              placeholder='Enter shipment ID'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='dockDoor'>Dock Door</Label>
            <Input
              id='dockDoor'
              value={dockDoorCode || ''}
              disabled
              placeholder='No dock assigned'
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={assignMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={assignMutation.isPending}>
            {assignMutation.isPending && (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
