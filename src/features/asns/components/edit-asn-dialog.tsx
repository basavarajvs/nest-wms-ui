import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateAsn } from '@/features/asns/data/asn-queries'
import type { AdvanceShipNoticeDto } from '@/lib/wms-api/types/wms-api'

const editAsnSchema = z.object({
  carrier_name: z.string().optional().or(z.literal('')),
  expected_arrival_date: z.string().optional().or(z.literal('')),
  tracking_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type EditAsnFormValues = z.infer<typeof editAsnSchema>

interface EditAsnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asn: AdvanceShipNoticeDto
  onSuccess?: () => void
}

export function EditAsnDialog({ open, onOpenChange, asn, onSuccess }: EditAsnDialogProps) {
  const updateMutation = useUpdateAsn()

  const form = useForm<EditAsnFormValues>({
    resolver: zodResolver(editAsnSchema),
    defaultValues: {
      carrier_name: asn.carrier_name ?? '',
      expected_arrival_date: asn.expected_arrival_date ?? '',
      tracking_number: asn.tracking_number ?? '',
      notes: asn.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        carrier_name: asn.carrier_name ?? '',
        expected_arrival_date: asn.expected_arrival_date ?? '',
        tracking_number: asn.tracking_number ?? '',
        notes: asn.notes ?? '',
      })
    }
  }, [open, asn, form])

  const handleSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      {
        id: String(asn.asn_id),
        data: {
          carrier_name: values.carrier_name || undefined,
          expected_arrival_date: values.expected_arrival_date || undefined,
          tracking_number: values.tracking_number || undefined,
          notes: values.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      },
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit ASN #{asn.asn_number}</DialogTitle>
          <DialogDescription>Update ASN header details</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="carrier_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expected_arrival_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Arrival</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tracking_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking #</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
