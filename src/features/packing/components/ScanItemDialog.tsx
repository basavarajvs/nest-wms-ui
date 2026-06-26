import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ScanLine } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  scanItemSchema,
  type ScanItemFormValues,
} from '../data/packing-schemas'
import { useScanItem, useSessionContainers } from '../data/packing-queries'

interface ScanItemDialogProps {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanItemDialog({ sessionId, open, onOpenChange }: ScanItemDialogProps) {
  const scanItem = useScanItem()
  const { data: containers } = useSessionContainers(open ? sessionId : undefined)

  const form = useForm<ScanItemFormValues>({
    resolver: zodResolver(scanItemSchema) as any,
    defaultValues: {
      productCode: '',
      quantity: 1,
      lpn: '',
      containerId: '',
    },
  })

  const handleSubmit = async (values: ScanItemFormValues) => {
    try {
      await scanItem.mutateAsync({
        sessionId,
        dto: {
          productCode: values.productCode,
          quantity: values.quantity,
          lpn: values.lpn || undefined,
          containerId: values.containerId || undefined,
        },
      })
      toast.success('Item scanned successfully')
      form.reset({ productCode: '', quantity: 1, lpn: '', containerId: '' })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Scan failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        form.reset()
        onOpenChange(false)
      }
    }}>
      <DialogContent className='sm:max-w-[480px]'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Scan Item</DialogTitle>
              <DialogDescription>
                Scan a product barcode into a container
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <FormField
                control={form.control}
                name='productCode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code / Barcode *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Scan or type...' autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                          min={1}
                          {...field}
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='containerId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select container' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {containers.filter((c) => c.status !== 'sealed').map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.containerCode || c.id.substring(0, 12)}
                            </SelectItem>
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
                name='lpn'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LPN (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Scan LPN barcode...' />
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
              <Button type='submit' disabled={scanItem.isPending}>
                <ScanLine className='mr-2 h-4 w-4' />
                {scanItem.isPending ? 'Scanning...' : 'Scan Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
