import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { Plus, Search, Edit, Trash2, MessageSquare, ArrowUpRight } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  useExceptions,
  useCreateException,
  useUpdateException,
  useDeleteException,
  type Exception,
} from './data/exception-queries'
import { ExceptionCommentDialog } from './components/ExceptionCommentDialog'

const exceptionSchema = z.object({
  exceptionType: z.string().min(1, 'Exception type is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  severity: z.string().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  productId: z.string().optional(),
  locationId: z.string().optional(),
  notes: z.string().optional(),
})

type ExceptionForm = z.infer<typeof exceptionSchema>

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return <Badge variant='outline'>—</Badge>
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    Critical: { variant: 'destructive' },
    High: { variant: 'default', className: 'bg-orange-500 text-white' },
    Medium: { variant: 'secondary', className: 'bg-yellow-500 text-white' },
    Low: { variant: 'default' },
  }
  const cfg = config[severity] || { variant: 'outline' as const }
  return <Badge variant={cfg.variant} className={cfg.className}>{severity}</Badge>
}

export function Exceptions() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingException, setEditingException] = useState<Exception | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [commentTarget, setCommentTarget] = useState<Exception | null>(null)

  const { data, isLoading, error, refetch } = useExceptions()
  const createMutation = useCreateException()
  const updateMutation = useUpdateException()
  const deleteMutation = useDeleteException()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExceptionForm>({
    resolver: zodResolver(exceptionSchema) as any,
    defaultValues: {
      exceptionType: '',
      facilityId: '',
      severity: '',
      referenceType: '',
      referenceId: '',
      productId: '',
      locationId: '',
      notes: '',
    },
  })

  const exceptions = data?.exceptions ?? []
  const filtered = exceptions.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return e.exceptionType.toLowerCase().includes(q) || (e.referenceType && e.referenceType.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (exc?: Exception) => {
    if (exc) {
      setEditingException(exc)
      reset({
        exceptionType: exc.exceptionType,
        facilityId: exc.facilityId,
        severity: exc.severity || '',
        referenceType: exc.referenceType || '',
        referenceId: exc.referenceId || '',
        productId: exc.productId || '',
        locationId: exc.locationId || '',
        notes: exc.notes || '',
      })
    } else {
      setEditingException(null)
      reset({ exceptionType: '', facilityId: '', severity: '', referenceType: '', referenceId: '', productId: '', locationId: '', notes: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ExceptionForm) => {
    try {
      if (editingException) {
        await updateMutation.mutateAsync({ id: editingException.id, dto: values as any })
        toast.success('Exception updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Exception created')
      }
      setDialogOpen(false)
      setEditingException(null)
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
      toast.success('Exception deleted')
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
            <h1 className='text-2xl font-bold tracking-tight'>Exceptions</h1>
            <p className='text-muted-foreground'>Manage warehouse exceptions</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='sm' asChild>
              <Link to='/admin/escalation-rules'>
                Escalation Rules <ArrowUpRight className='ml-1 h-3 w-3' />
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Exception
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingException ? 'Edit Exception' : 'Create New Exception'}</DialogTitle>
                <DialogDescription>
                  {editingException ? 'Update the exception details below.' : 'Add a new exception to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='exceptionType'>Exception Type *</Label>
                  <Input id='exceptionType' {...register('exceptionType')} />
                  {errors.exceptionType && <p className='text-sm text-destructive'>{errors.exceptionType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='severity'>Severity</Label>
                  <Select
                    value={watch('severity') || ''}
                    onValueChange={(value) => setValue('severity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select severity...' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Critical'>Critical</SelectItem>
                      <SelectItem value='High'>High</SelectItem>
                      <SelectItem value='Medium'>Medium</SelectItem>
                      <SelectItem value='Low'>Low</SelectItem>
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
                  <Label htmlFor='locationId'>Location ID</Label>
                  <Input id='locationId' {...register('locationId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingException ? 'Save Changes' : 'Create Exception'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search exceptions...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions</CardTitle>
          <CardDescription>{total} exceptions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load exceptions</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No exceptions found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((exc) => (
                    <TableRow key={exc.id}>
                      <TableCell className='font-medium'>{exc.exceptionType}</TableCell>
                      <TableCell>{exc.facilityId}</TableCell>
                      <TableCell><SeverityBadge severity={exc.severity} /></TableCell>
                      <TableCell>{exc.referenceType ? `${exc.referenceType}:${exc.referenceId || ''}` : '—'}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={exc.status || 'Open'}
                          onValueChange={(value) => {
                            updateMutation.mutate(
                              { id: exc.id, dto: { status: value } },
                              { onSuccess: () => toast.success('Exception status updated'), onError: () => toast.error('Failed to update status') }
                            )
                          }}
                        >
                          <SelectTrigger className='h-7 w-[130px]'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Open'>Open</SelectItem>
                            <SelectItem value='Acknowledged'>Acknowledged</SelectItem>
                            <SelectItem value='Resolved'>Resolved</SelectItem>
                            <SelectItem value='Closed'>Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className='space-x-1 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => setCommentTarget(exc)} title='Comments'><MessageSquare className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(exc)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(exc.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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
            <AlertDialogTitle>Delete Exception?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {commentTarget && (
        <ExceptionCommentDialog
          open={!!commentTarget}
          onOpenChange={(o) => { if (!o) setCommentTarget(null) }}
          exceptionId={commentTarget.id}
          exceptionType={commentTarget.exceptionType}
        />
      )}
    </div>
  )
}
