import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import type { CreateHoldDtoHoldType } from '@/lib/types/wms-api'
import type { Product } from '@/features/items/products/data/product-queries'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductSearchSelect } from '@/components/ProductSearchSelect'
import { LocationSelect } from '@/components/common/forms/LocationSelect'
import { useCreateHold } from '@/features/inventory/holds/data/hold-queries'
import { useFacility } from '@/hooks/useFacility'

const HOLD_TYPE_OPTIONS = [
  { value: 'QA', label: 'QA Hold' },
  { value: 'DAMAGE', label: 'Damage Hold' },
  { value: 'CUSTOMER_HOLD', label: 'Customer Hold' },
  { value: 'CUSTOMER_REQUEST', label: 'Customer Request' },
  { value: 'DISPUTE', label: 'Dispute' },
  { value: 'QC_PENDING', label: 'QC Pending' },
  { value: 'QC_FAILED', label: 'QC Failed' },
  { value: 'QUARANTINE', label: 'Quarantine' },
  { value: 'CREDIT_HOLD', label: 'Credit Hold' },
  { value: 'OTHER', label: 'Other' },
]

const applyHoldSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  locationId: z.string().optional(),
  lotId: z.string().optional(),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  holdType: z.string().min(1, 'Hold type is required'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

type ApplyHoldForm = z.infer<typeof applyHoldSchema>

interface ApplyHoldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplyHoldDialog({ open, onOpenChange }: ApplyHoldDialogProps) {
  const createHold = useCreateHold()
  const { selectedFacility } = useFacility()

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined)

  const form = useForm<ApplyHoldForm>({
    resolver: zodResolver(applyHoldSchema) as any,
    defaultValues: {
      productId: '',
      locationId: '',
      lotId: '',
      quantity: undefined as unknown as number,
      holdType: '',
      reason: '',
      notes: '',
    },
  })

  const handleSubmit = async (values: ApplyHoldForm) => {
    if (!selectedFacility?.id) {
      toast.error('Please select a facility first')
      return
    }
    if (!selectedProduct?.id) {
      toast.error('Please select a valid product')
      return
    }
    try {
      await createHold.mutateAsync({
        facilityId: selectedFacility.id,
        productId: selectedProduct.id,
        locationId: values.locationId || undefined,
        lotId: values.lotId || undefined,
        quantity: values.quantity,
        holdType: values.holdType as CreateHoldDtoHoldType,
        reason: values.reason,
        notes: values.notes || undefined,
      })
      toast.success('Hold applied successfully')
      onOpenChange(false)
      form.reset()
      setSelectedProduct(undefined)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to apply hold')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset()
        setSelectedProduct(undefined)
      }
      onOpenChange(open)
    }}>
      <DialogContent className='sm:max-w-[560px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Apply Hold</DialogTitle>
              <DialogDescription>
                Place inventory on hold for quality, damage, or other reasons
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='productId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <FormControl>
                      <ProductSearchSelect
                        value={field.value}
                        onValueChange={(productCode, product) => {
                          field.onChange(productCode)
                          setSelectedProduct(product)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid grid-cols-2 gap-4'>
                <LocationSelect
                  control={form.control as any}
                  name='locationId'
                  label='Location'
                  placeholder='Select location (optional)'
                />
                <FormField
                  control={form.control}
                  name='lotId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot/Serial</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder='Lot or serial number (optional)' />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          min={0}
                          step='any'
                          placeholder='0'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='holdType'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hold Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select hold type' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HOLD_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name='reason'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder='Reason for placing this hold...' rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder='Additional notes (optional)...' rows={2} />
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
              <Button type='submit' disabled={createHold.isPending}>
                {createHold.isPending ? 'Applying...' : 'Apply Hold'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
