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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createHazmatSchema } from '@/features/quality/hazmat/data/hazmat-schemas'
import { useRegisterHazmat } from '@/features/quality/hazmat/data/hazmat-queries'
import { useFacility } from '@/hooks/useFacility'
import type * as z from 'zod'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormValues = z.infer<typeof createHazmatSchema>

export function HazmatDialog({ open, onOpenChange }: Props) {
  const { selectedFacility } = useFacility()
  const registerHazmat = useRegisterHazmat()

  const form = useForm<FormValues>({
    resolver: zodResolver(createHazmatSchema),
    defaultValues: {
      hazardClass: '3',
      packingGroup: 'II',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await registerHazmat.mutateAsync({
        ...values,
        facilityId: selectedFacility?.id || '',
      })
      toast.success('Hazmat material registered')
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to register hazmat')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[540px]'>
        <DialogHeader>
          <DialogTitle>Register Hazmat Material</DialogTitle>
          <DialogDescription>Register a hazardous material for compliance tracking</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='productId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Product ID' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='hazardClass'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hazard Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='unNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UN Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g., UN1203' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='properShippingName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proper Shipping Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='e.g., Gasoline' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='packingGroup'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packing Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='I'>I (Great Danger)</SelectItem>
                        <SelectItem value='II'>II (Medium Danger)</SelectItem>
                        <SelectItem value='III'>III (Minor Danger)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='division'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Division</FormLabel>
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
                name='flashPoint'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flash Point</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g., -20°C' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='storageGroup'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Group</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Optional' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='msdsUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MSDS URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='https://...' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='emergencyContact'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Name' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='emergencyPhone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='+1-555-...' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex justify-end gap-3 pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' disabled={registerHazmat.isPending}>
                {registerHazmat.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Register
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
