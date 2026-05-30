import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCreateTransfer } from '@/features/transfers/data/transfer-queries'
import { useFacility } from '@/hooks/useFacility'
import { useNavigate } from '@tanstack/react-router'
import { TransferTypeSelect } from '@/components/common/forms/TransferTypeSelect'
import { NotesTextarea } from '@/components/common/forms/NotesTextarea'

const transferSchema = z.object({
  transferType: z.enum(['INTERNAL', 'INTER_FACILITY', 'RETURN', 'CUSTOMER'], {
    errorMap: () => ({ message: 'Transfer type is required' }),
  }),
  facilityId: z.string().min(1, 'Source facility is required'),
  fromLocationId: z.string().optional(),
  toFacilityId: z.string().optional(),
  toLocationId: z.string().min(1, 'Destination location is required'),
  notes: z.string().optional(),
})

type TransferForm = z.infer<typeof transferSchema>

interface CreateTransferFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateTransferForm({ onSuccess, onCancel }: CreateTransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createMutation = useCreateTransfer()
  const { selectedFacility } = useFacility()
  const navigate = useNavigate()

  const form = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      transferType: undefined,
      facilityId: selectedFacility?.id || '',
      fromLocationId: '',
      toFacilityId: '',
      toLocationId: '',
      notes: '',
    },
  })

  const onSubmit = async (formData: TransferForm) => {
    if (!selectedFacility && !formData.facilityId) {
      toast.error('Please select a facility from the top bar or enter a facility ID')
      return
    }
    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync({
        transferType: formData.transferType,
        facilityId: formData.facilityId || selectedFacility!.id,
        fromLocationId: formData.fromLocationId || undefined,
        toFacilityId: formData.toFacilityId || undefined,
        toLocationId: formData.toLocationId,
        notes: formData.notes || undefined,
      })
      toast.success('Transfer created successfully')
      form.reset()
      if (onSuccess) onSuccess()
      else navigate({ to: '/transfers' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create transfer')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!onCancel && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create Transfer</h1>
              <p className="text-muted-foreground">
                Initiate a new inventory transfer between locations or facilities
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: '/transfers' })}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transfers
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Transfer'}
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
              Specify the type, origin, and destination for the inventory movement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFacility && (
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Source Facility: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TransferTypeSelect
                control={form.control}
                name="transferType"
                required
              />

              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Facility ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={selectedFacility ? selectedFacility.id : 'facility-uuid'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fromLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Origin location (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Location *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Destination location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="toFacilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Facility</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Target facility (for inter-facility transfers)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <NotesTextarea
              control={form.control}
              name="notes"
              label="Notes"
              placeholder="Additional notes or instructions..."
            />

            {onCancel && (
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Transfer'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
