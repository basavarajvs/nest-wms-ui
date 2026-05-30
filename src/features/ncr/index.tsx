import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  useNcrs,
  useCreateNcr,
  useUpdateNcr,
  useDeleteNcr,
  type Ncr,
} from './data/ncr-queries'

const ncrSchema = z.object({
  ncrName: z.string().optional(),
  facilityId: z.string().min(1, 'Facility ID is required'),
  description: z.string().optional(),
  severity: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  productId: z.string().optional(),
  notes: z.string().optional(),
})

type NcrForm = z.infer<typeof ncrSchema>

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant='outline'>—</Badge>
  const pair: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    Critical: { variant: 'destructive' },
    Major: { variant: 'outline', className: 'border-orange-300 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950/30' },
    Minor: { variant: 'secondary' },
    Observation: { variant: 'default' },
  }
  const { variant, className } = pair[severity] || { variant: 'outline' as const }
  return <Badge variant={variant} className={className}>{severity}</Badge>
}

export function Ncrs() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNcr, setEditingNcr] = useState<Ncr | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useNcrs()
  const createMutation = useCreateNcr()
  const updateMutation = useUpdateNcr()
  const deleteMutation = useDeleteNcr()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NcrForm>({
    resolver: zodResolver(ncrSchema) as any,
    defaultValues: {
      ncrName: '',
      facilityId: '',
      description: '',
      severity: '',
      referenceType: '',
      referenceId: '',
      productId: '',
      notes: '',
    },
  })

  const ncrs = data?.ncrs ?? []
  const filtered = ncrs.filter((n) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (n.ncrName && n.ncrName.toLowerCase().includes(q)) || (n.description && n.description.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (ncr?: Ncr) => {
    if (ncr) {
      setEditingNcr(ncr)
      reset({
        ncrName: ncr.ncrName || '',
        facilityId: ncr.facilityId,
        description: ncr.description || '',
        severity: ncr.severity || '',
        referenceType: ncr.referenceType || '',
        referenceId: ncr.referenceId || '',
        productId: ncr.productId || '',
        notes: ncr.notes || '',
      })
    } else {
      setEditingNcr(null)
      reset({ ncrName: '', facilityId: '', description: '', severity: '', referenceType: '', referenceId: '', productId: '', notes: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: NcrForm) => {
    try {
      if (editingNcr) {
        await updateMutation.mutateAsync({ id: editingNcr.id, dto: values as any })
        toast.success('NCR updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('NCR created')
      }
      setDialogOpen(false)
      setEditingNcr(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('NCR deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Non-Conformance Reports</h1>
          <p className='text-muted-foreground'>Manage quality non-conformance reports</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New NCR
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingNcr ? 'Edit NCR' : 'Create New NCR'}</DialogTitle>
                <DialogDescription>
                  {editingNcr ? 'Update the NCR details below.' : 'Add a new non-conformance report to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='ncrName'>NCR Name</Label>
                  <Input id='ncrName' {...register('ncrName')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Input id='description' {...register('description')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='severity'>Severity</Label>
                  <Select onValueChange={(value) => setValue('severity', value)} value={watch('severity') || ''}>
                    <SelectTrigger id='severity'>
                      <SelectValue placeholder='Select severity' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Critical'>Critical</SelectItem>
                      <SelectItem value='Major'>Major</SelectItem>
                      <SelectItem value='Minor'>Minor</SelectItem>
                      <SelectItem value='Observation'>Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='referenceType'>Reference Type</Label>
                  <Input id='referenceType' {...register('referenceType')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='referenceId'>Reference ID</Label>
                  <Input id='referenceId' {...register('referenceId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID</Label>
                  <Input id='productId' {...register('productId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingNcr ? 'Save Changes' : 'Create NCR'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search NCRs...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Non-Conformance Reports</CardTitle>
          <CardDescription>{total} NCRs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load NCRs</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No NCRs found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((ncr) => (
                    <TableRow key={ncr.id}>
                      <TableCell className='font-medium'>{ncr.ncrName || '—'}</TableCell>
                      <TableCell>{ncr.facilityId}</TableCell>
                      <TableCell><SeverityBadge severity={ncr.severity} /></TableCell>
                      <TableCell>{ncr.referenceType ? `${ncr.referenceType}:${ncr.referenceId || ''}` : '—'}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={ncr.status || 'Open'}
                          onValueChange={(value) => {
                            updateMutation.mutate(
                              { id: ncr.id, dto: { status: value } as any },
                              {
                                onSuccess: () => toast.success('NCR status updated'),
                                onError: (e) => toast.error('Failed: ' + ((e as any)?.message || 'Unknown')),
                              }
                            )
                          }}
                        >
                          <SelectTrigger className='h-7 w-[130px]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Open'>Open</SelectItem>
                            <SelectItem value='Investigating'>Investigating</SelectItem>
                            <SelectItem value='Resolved'>Resolved</SelectItem>
                            <SelectItem value='Closed'>Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(ncr)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(ncr.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete NCR?</AlertDialogTitle>
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
