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
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createWorkstationSchema,
  updateWorkstationSchema,
  type CreateWorkstationFormValues,
  type UpdateWorkstationFormValues,
} from '@/features/vas-catalog/data/vas-catalog-schemas'
import { useCreateVasWorkstation, useUpdateVasWorkstation, type VasWorkstation } from '@/features/vas-catalog/data/vas-catalog-queries'
import { useFacility } from '@/hooks/useFacility'

const STATION_TYPES = [
  { value: 'KITTING', label: 'Kitting' },
  { value: 'LABELING', label: 'Labeling' },
  { value: 'ASSEMBLY', label: 'Assembly' },
  { value: 'PACKING', label: 'Packing' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editWorkstation?: VasWorkstation
}

export function WorkstationDialog({ open, onOpenChange, editWorkstation }: Props) {
  const { selectedFacility } = useFacility()
  const createWorkstation = useCreateVasWorkstation()
  const updateWorkstation = useUpdateVasWorkstation()
  const isEditing = !!editWorkstation

  const defaultValues = useMemo(() => {
    if (editWorkstation) {
      return {
        workstationName: editWorkstation.workstationName,
        locationId: editWorkstation.locationId || '',
        capabilities: editWorkstation.capabilities ? JSON.stringify(editWorkstation.capabilities, null, 2) : '',
        isAvailable: editWorkstation.isAvailable,
        isActive: editWorkstation.isActive,
      } satisfies UpdateWorkstationFormValues
    }
    return {
      workstationCode: '',
      workstationName: '',
      stationType: 'KITTING' as const,
      facilityId: selectedFacility?.id || '',
      locationId: '',
      capabilities: '',
    } satisfies CreateWorkstationFormValues
  }, [editWorkstation, selectedFacility])

  const form = useForm<CreateWorkstationFormValues | UpdateWorkstationFormValues>({
    resolver: zodResolver(isEditing ? updateWorkstationSchema : createWorkstationSchema),
    defaultValues: defaultValues as any,
  })

  useEffect(() => {
    form.reset(defaultValues as any)
  }, [form, defaultValues])

  const onSubmit = async (values: CreateWorkstationFormValues | UpdateWorkstationFormValues) => {
    try {
      const payload: any = { ...values }
      if (payload.capabilities && typeof payload.capabilities === 'string') {
        try {
          payload.capabilities = JSON.parse(payload.capabilities)
        } catch {
          payload.capabilities = undefined
        }
      }
      if (isEditing && editWorkstation) {
        await updateWorkstation.mutateAsync({
          id: editWorkstation.id,
          dto: payload as any,
        })
        toast.success('Workstation updated')
      } else {
        await createWorkstation.mutateAsync(payload as any)
        toast.success('Workstation created')
      }
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save workstation')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Workstation' : 'Create Workstation'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the VAS workstation details' : 'Register a new VAS workstation'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {!isEditing && (
              <>
                <FormField
                  control={form.control}
                  name='workstationCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workstation Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='e.g. WS-001' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='stationType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATION_TYPES.map((st) => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='facilityId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Facility ID' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <FormField
              control={form.control}
              name='workstationName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workstation Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g. Kitting Station A' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='locationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Optional location' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='capabilities'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capabilities (JSON)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder='{"labeling": true, "maxWeight": 50}' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <div className='flex gap-4'>
                <FormField
                  control={form.control}
                  name='isAvailable'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2'>
                      <FormControl>
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='!mt-0'>Available</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='isActive'
                  render={({ field }) => (
                    <FormItem className='flex items-center gap-2'>
                      <FormControl>
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='!mt-0'>Active</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createWorkstation.isPending || updateWorkstation.isPending}>
                {(createWorkstation.isPending || updateWorkstation.isPending) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditing ? 'Save' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
