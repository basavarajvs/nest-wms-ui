import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  useShippingLabels,
  useGenerateShippingLabel,
  usePrintShippingLabel,
  useDeleteShippingLabel,
  type ShippingLabel,
} from './data/shipping-label-queries'

const generateSchema = z.object({
  labelType: z.string().min(1, 'Label type is required'),
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  carrierCode: z.string().optional(),
})

type GenerateForm = z.infer<typeof generateSchema>

export function ShippingLabels() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading, error, refetch } = useShippingLabels()
  const generateMutation = useGenerateShippingLabel()
  const printMutation = usePrintShippingLabel()
  const deleteMutation = useDeleteShippingLabel()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema) as any,
    defaultValues: {
      labelType: '',
      shipmentId: '',
      carrierCode: '',
    },
  })

  const labels = data?.labels ?? []
  const filtered = labels.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.labelType.toLowerCase().includes(q) || l.shipmentId.toLowerCase().includes(q) || (l.trackingNumber && l.trackingNumber.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openGenerateDialog = () => {
    reset({ labelType: '', shipmentId: '', carrierCode: '' })
    setDialogOpen(true)
  }

  const onSubmit = async (values: GenerateForm) => {
    try {
      await generateMutation.mutateAsync(values as any)
      toast.success('Shipping label generated')
      setDialogOpen(false)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Generation failed')
    }
  }

  const handlePrint = async (id: string) => {
    try {
      await printMutation.mutateAsync(id)
      toast.success('Label sent to printer')
    } catch (err: any) {
      toast.error(err?.message || 'Print failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Label deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Shipping Labels</h1>
          <p className='text-muted-foreground'>Manage shipping labels</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openGenerateDialog}>
              <Plus className='mr-2 h-4 w-4' /> Generate Label
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Generate Shipping Label</DialogTitle>
                <DialogDescription>
                  Generate a new shipping label for a shipment.
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='labelType'>Label Type *</Label>
                  <Input id='labelType' {...register('labelType')} placeholder='e.g. SHIPMENT, PALLET' />
                  {errors.labelType && <p className='text-sm text-destructive'>{errors.labelType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='shipmentId'>Shipment ID *</Label>
                  <Input id='shipmentId' {...register('shipmentId')} />
                  {errors.shipmentId && <p className='text-sm text-destructive'>{errors.shipmentId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='carrierCode'>Carrier Code</Label>
                  <Input id='carrierCode' {...register('carrierCode')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || generateMutation.isPending}>
                  Generate
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search labels...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Labels</CardTitle>
          <CardDescription>{total} labels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load shipping labels</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No shipping labels found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((label) => (
                    <TableRow key={label.id}>
                      <TableCell className='font-medium'>{label.labelType}</TableCell>
                      <TableCell>{label.shipmentId}</TableCell>
                      <TableCell>{label.trackingNumber || '—'}</TableCell>
                      <TableCell><Badge variant='outline'>{label.status || 'Generated'}</Badge></TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => handlePrint(label.id)} title='Print'><Printer className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(label.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className='mt-4 flex justify-between text-sm'>
                <span>Page {page} of {totalPages}</span>
                <div className='space-x-2'>
                  <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipping Label?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
