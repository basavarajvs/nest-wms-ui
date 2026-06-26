import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { generateSnapshotSchema, type GenerateSnapshotFormValues } from '@/features/billing/data/billing-schemas'
import { useGenerateSnapshot } from '@/features/billing/data/billing-queries'
import { useFacility } from '@/hooks/useFacility'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SnapshotGenerateDialog({ open, onOpenChange }: Props) {
  const { selectedFacility } = useFacility()
  const generate = useGenerateSnapshot()

  const form = useForm<GenerateSnapshotFormValues>({
    resolver: zodResolver(generateSnapshotSchema),
    defaultValues: { facilityId: selectedFacility?.id || '', clientId: '', snapshotDate: new Date().toISOString().split('T')[0] },
  })

  useEffect(() => {
    if (selectedFacility) form.setValue('facilityId', selectedFacility.id)
  }, [form, selectedFacility])

  const onSubmit = async (values: GenerateSnapshotFormValues) => {
    try {
      await generate.mutateAsync(values)
      toast.success('Snapshot generated')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate snapshot')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Generate Snapshot</DialogTitle>
          <DialogDescription>Generate a daily inventory snapshot for billing</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField control={form.control} name='facilityId' render={({ field }) => (
              <FormItem><FormLabel>Facility ID *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='clientId' render={({ field }) => (
              <FormItem><FormLabel>Client ID *</FormLabel><FormControl><Input {...field} placeholder='Client ID' /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name='snapshotDate' render={({ field }) => (
              <FormItem><FormLabel>Snapshot Date *</FormLabel><FormControl><Input type='date' {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={generate.isPending}>
                {generate.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Generate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
