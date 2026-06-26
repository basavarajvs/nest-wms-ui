import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useFacility } from '@/hooks/useFacility'
import {
  startSessionSchema,
  type StartSessionFormValues,
} from '../data/packing-schemas'
import { useStartPackingSession } from '../data/packing-queries'

interface StartSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated: (session: any) => void
}

export function StartSessionDialog({ open, onOpenChange, onSessionCreated }: StartSessionDialogProps) {
  const startSession = useStartPackingSession()
  const { selectedFacility } = useFacility()

  const form = useForm<StartSessionFormValues>({
    resolver: zodResolver(startSessionSchema) as any,
    defaultValues: { stationCode: '' },
  })

  const handleSubmit = async (values: StartSessionFormValues) => {
    if (!selectedFacility?.id) {
      toast.error('Please select a facility first')
      return
    }
    try {
      const res = await startSession.mutateAsync({
        stationCode: values.stationCode,
        facilityId: selectedFacility.id,
      })
      onSessionCreated(res)
      toast.success('Packing session started')
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start session')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset()
        onOpenChange(false)
      }
    }}>
      <DialogContent className='sm:max-w-[420px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Start Packing Session</DialogTitle>
              <DialogDescription>
                Enter the packing station code to begin a new session
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='stationCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Station Code *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Scan or type station code...' autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={startSession.isPending}>
                <Play className='mr-2 h-4 w-4' />
                {startSession.isPending ? 'Starting...' : 'Start Session'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
