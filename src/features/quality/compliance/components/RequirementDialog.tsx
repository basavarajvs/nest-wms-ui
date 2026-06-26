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
import { createRequirementSchema } from '@/features/quality/compliance/data/compliance-schemas'
import { useCreateRequirement } from '@/features/quality/compliance/data/compliance-queries'
import { useFacility } from '@/hooks/useFacility'
import type * as z from 'zod'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormValues = z.infer<typeof createRequirementSchema>

export function RequirementDialog({ open, onOpenChange }: Props) {
  const { selectedFacility } = useFacility()
  const createRequirement = useCreateRequirement()

  const form = useForm<FormValues>({
    resolver: zodResolver(createRequirementSchema),
    defaultValues: {
      complianceType: 'ISO',
      frequencyType: 'ONCE',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createRequirement.mutateAsync({
        ...values,
        facilityId: selectedFacility?.id || '',
      })
      toast.success('Requirement created')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create requirement')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogHeader>
          <DialogTitle>Create Compliance Requirement</DialogTitle>
          <DialogDescription>Add a new compliance requirement</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='complianceType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compliance Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='FDA'>FDA</SelectItem>
                      <SelectItem value='OSHA'>OSHA</SelectItem>
                      <SelectItem value='ISO'>ISO</SelectItem>
                      <SelectItem value='CUSTOM'>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='requirementCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g., ISO-9001-7.1' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='applicableEntity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applies To</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PRODUCT'>Product</SelectItem>
                        <SelectItem value='LOCATION'>Location</SelectItem>
                        <SelectItem value='FACILITY'>Facility</SelectItem>
                        <SelectItem value='PROCESS'>Process</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='frequencyType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ONCE'>Once</SelectItem>
                        <SelectItem value='DAILY'>Daily</SelectItem>
                        <SelectItem value='WEEKLY'>Weekly</SelectItem>
                        <SelectItem value='MONTHLY'>Monthly</SelectItem>
                        <SelectItem value='QUARTERLY'>Quarterly</SelectItem>
                        <SelectItem value='ANNUAL'>Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={createRequirement.isPending}>
                {createRequirement.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
