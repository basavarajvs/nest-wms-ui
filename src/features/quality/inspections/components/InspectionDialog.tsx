import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInspectionSchema, updateInspectionSchema } from '@/features/quality/inspections/data/inspection-schemas'
import { useCreateInspection, useUpdateInspection, type Inspection } from '@/features/quality/inspections/data/inspection-queries'
import { useFacility } from '@/hooks/useFacility'
import type * as z from 'zod'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editInspection?: Inspection
}

type CreateFormValues = z.infer<typeof createInspectionSchema>
type UpdateFormValues = z.infer<typeof updateInspectionSchema>

export function InspectionDialog({ open, onOpenChange, editInspection }: Props) {
  const { selectedFacility } = useFacility()
  const createInspection = useCreateInspection()
  const updateInspection = useUpdateInspection()
  const isEditing = !!editInspection

  const defaultValues = useMemo(() => {
    if (editInspection) {
      return {
        notes: editInspection.notes || '',
        priority: editInspection.priority || 'MEDIUM',
        assignedToUserId: editInspection.assignedToUserId || '',
      }
    }
    return {
      inspectionType: 'ROUTINE' as const,
      priority: 'MEDIUM' as const,
      productId: '',
      lotId: '',
      locationId: '',
      referenceType: '',
      referenceId: '',
      assignedToUserId: '',
      scheduledDate: '',
      notes: '',
    }
  }, [editInspection])

  const form = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(isEditing ? updateInspectionSchema : createInspectionSchema),
    defaultValues: defaultValues as any,
  })

  useEffect(() => {
    form.reset(defaultValues as any)
  }, [form, defaultValues])

  const onSubmit = async (values: CreateFormValues | UpdateFormValues) => {
    try {
      if (isEditing && editInspection) {
        await updateInspection.mutateAsync({
          id: editInspection.id,
          dto: values as any,
        })
        toast.success('Inspection updated')
      } else {
        await createInspection.mutateAsync({
          ...(values as CreateFormValues),
          facilityId: selectedFacility?.id || '',
        })
        toast.success('Inspection created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save inspection')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Inspection' : 'Create Inspection'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the inspection details' : 'Schedule a new quality inspection'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name='inspectionType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='RECEIVING'>Receiving</SelectItem>
                          <SelectItem value='PICKING'>Picking</SelectItem>
                          <SelectItem value='RETURN'>Return</SelectItem>
                          <SelectItem value='ROUTINE'>Routine</SelectItem>
                          <SelectItem value='COMPLIANCE'>Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='LOW'>Low</SelectItem>
                          <SelectItem value='MEDIUM'>Medium</SelectItem>
                          <SelectItem value='HIGH'>High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='productId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Optional' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='lotId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lot ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Optional' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='locationId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Optional' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='referenceType'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='e.g. PO, SO, ASN' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='referenceId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='Document ID' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='assignedToUserId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='User ID' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='scheduledDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {isEditing && (
              <>
                <FormField
                  control={form.control}
                  name='priority'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='LOW'>Low</SelectItem>
                          <SelectItem value='MEDIUM'>Medium</SelectItem>
                          <SelectItem value='HIGH'>High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='assignedToUserId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='User ID' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createInspection.isPending || updateInspection.isPending}>
                {(createInspection.isPending || updateInspection.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
