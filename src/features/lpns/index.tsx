import React, { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, Edit, Trash2, Move, ChevronDown, ChevronRight, Folders, X } from 'lucide-react'
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
  useLpns,
  useCreateLpn,
  useUpdateLpn,
  useDeleteLpn,
  useMoveLpn,
  useLpnChildren,
  useNestLpn,
  useUnnestLpn,
  useUpdateLpnStatus,
  type Lpn,
} from './data/lpn-queries'

const lpnSchema = z.object({
  lpnNumber: z.string().min(1, 'LPN number is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  lpnType: z.string().min(1, 'LPN type is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  productId: z.string().optional(),
  quantity: z.coerce.number().optional(),
  uomId: z.string().min(1, 'UOM ID is required'),
  lotNumber: z.string().optional(),
})

type LpnForm = z.infer<typeof lpnSchema>

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Available: 'default',
  Reserved: 'secondary',
  Shipped: 'outline',
  Damaged: 'destructive',
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant='outline'>Unknown</Badge>
  return <Badge variant={statusVariant[status] || 'outline'}>{status}</Badge>
}

export function Lpns() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLpn, setEditingLpn] = useState<Lpn | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [movingLpnId, setMovingLpnId] = useState<string | null>(null)
  const [newLocationId, setNewLocationId] = useState('')

  const [expandedLpnId, setExpandedLpnId] = useState<string | null>(null)
  const [nestDialogOpen, setNestDialogOpen] = useState(false)
  const [nestParentLpnId, setNestParentLpnId] = useState('')
  const [nestingLpnId, setNestingLpnId] = useState<string | null>(null)
  const [unnestConfirmId, setUnnestConfirmId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useLpns()
  const createMutation = useCreateLpn()
  const updateMutation = useUpdateLpn()
  const deleteMutation = useDeleteLpn()
  const moveMutation = useMoveLpn()
  const { data: childLpns, isLoading: childrenLoading } = useLpnChildren(expandedLpnId ?? '')
  const nestLpn = useNestLpn()
  const unnestLpn = useUnnestLpn()
  const updateStatus = useUpdateLpnStatus()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LpnForm>({
    resolver: zodResolver(lpnSchema) as any,
    defaultValues: {
      lpnNumber: '',
      facilityId: '',
      lpnType: '',
      locationId: '',
      productId: '',
      quantity: undefined,
      uomId: '',
      lotNumber: '',
    },
  })

  const lpns = data?.lpns ?? []
  const filtered = lpns.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.lpnNumber.toLowerCase().includes(q) || l.lpnType.toLowerCase().includes(q)
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (lpn?: Lpn) => {
    if (lpn) {
      setEditingLpn(lpn)
      reset({
        lpnNumber: lpn.lpnNumber,
        facilityId: lpn.facilityId,
        lpnType: lpn.lpnType || '',
        locationId: lpn.locationId,
        productId: lpn.productId || '',
        quantity: lpn.quantity,
        uomId: lpn.uomId,
        lotNumber: lpn.lotNumber || '',
      })
    } else {
      setEditingLpn(null)
      reset({ lpnNumber: '', facilityId: '', lpnType: '', locationId: '', productId: '', quantity: undefined, uomId: '', lotNumber: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: LpnForm) => {
    try {
      if (editingLpn) {
        await updateMutation.mutateAsync({ id: editingLpn.id, dto: values as any })
        toast.success('LPN updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('LPN created')
      }
      setDialogOpen(false)
      setEditingLpn(null)
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
      toast.success('LPN deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const openMoveDialog = (lpnId: string) => {
    setMovingLpnId(lpnId)
    setNewLocationId('')
    setMoveDialogOpen(true)
  }

  const handleMove = async () => {
    if (!movingLpnId || !newLocationId) return
    try {
      await moveMutation.mutateAsync({ id: movingLpnId, locationId: newLocationId })
      toast.success('LPN moved')
      setMoveDialogOpen(false)
      setMovingLpnId(null)
      setNewLocationId('')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Move failed')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>LPN Management</h1>
          <p className='text-muted-foreground'>Manage License Plate Numbers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New LPN
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingLpn ? 'Edit LPN' : 'Create New LPN'}</DialogTitle>
                <DialogDescription>
                  {editingLpn ? 'Update the LPN details below.' : 'Add a new license plate number to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='lpnNumber'>LPN Number *</Label>
                  <Input id='lpnNumber' {...register('lpnNumber')} disabled={!!editingLpn} />
                  {errors.lpnNumber && <p className='text-sm text-destructive'>{errors.lpnNumber.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='lpnType'>LPN Type *</Label>
                  <Input id='lpnType' {...register('lpnType')} />
                  {errors.lpnType && <p className='text-sm text-destructive'>{errors.lpnType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='locationId'>Location ID *</Label>
                  <Input id='locationId' {...register('locationId')} />
                  {errors.locationId && <p className='text-sm text-destructive'>{errors.locationId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID</Label>
                  <Input id='productId' {...register('productId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='quantity'>Quantity</Label>
                  <Input id='quantity' type='number' {...register('quantity')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='uomId'>UOM ID *</Label>
                  <Input id='uomId' {...register('uomId')} />
                  {errors.uomId && <p className='text-sm text-destructive'>{errors.uomId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='lotNumber'>Lot Number</Label>
                  <Input id='lotNumber' {...register('lotNumber')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingLpn ? 'Save Changes' : 'Create LPN'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search LPNs...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LPN Management</CardTitle>
          <CardDescription>{total} LPNs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load LPNs</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No LPNs found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-10'></TableHead>
                    <TableHead>LPN Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((lpn) => (
                    <React.Fragment key={lpn.id}>
                      <TableRow>
                        <TableCell>
                          <Button variant='ghost' size='icon' onClick={() => setExpandedLpnId(expandedLpnId === lpn.id ? null : lpn.id)} title={expandedLpnId === lpn.id ? 'Collapse' : 'Expand'}>
                            {expandedLpnId === lpn.id ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                          </Button>
                        </TableCell>
                        <TableCell className='font-medium'>{lpn.lpnNumber}</TableCell>
                        <TableCell>{lpn.lpnType}</TableCell>
                        <TableCell>{lpn.locationId}</TableCell>
                        <TableCell>{lpn.productId || '—'}</TableCell>
                        <TableCell>{lpn.quantity ?? '—'}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={lpn.status ?? 'Available'}
                            onValueChange={(value) => {
                              updateStatus.mutate(
                                { id: lpn.id, dto: { status: value as any } },
                                { onSuccess: () => toast.success('LPN status updated'), onError: () => toast.error('Failed to update status') }
                              )
                            }}
                          >
                            <SelectTrigger className='h-7 w-[130px]'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='Available'><span className='text-green-600'>●</span> Available</SelectItem>
                              <SelectItem value='Reserved'><span className='text-blue-600'>●</span> Reserved</SelectItem>
                              <SelectItem value='Shipped'><span className='text-purple-600'>●</span> Shipped</SelectItem>
                              <SelectItem value='Damaged'><span className='text-red-600'>●</span> Damaged</SelectItem>
                              <SelectItem value='Lost'><span className='text-gray-600'>●</span> Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className='space-x-1 text-right'>
                          <Button variant='ghost' size='icon' onClick={() => { setNestingLpnId(lpn.id); setNestParentLpnId(''); setNestDialogOpen(true) }} title='Nest LPN'><Folders className='h-4 w-4' /></Button>
                          {lpn.parentLpnId && (
                            <Button variant='ghost' size='icon' onClick={() => setUnnestConfirmId(lpn.id)} title='Unnest LPN'><X className='h-4 w-4 text-destructive' /></Button>
                          )}
                          <Button variant='ghost' size='icon' onClick={() => openMoveDialog(lpn.id)} title='Move LPN'><Move className='h-4 w-4' /></Button>
                          <Button variant='ghost' size='icon' onClick={() => openDialog(lpn)}><Edit className='h-4 w-4' /></Button>
                          <Button variant='ghost' size='icon' onClick={() => setDeleteId(lpn.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
                        </TableCell>
                      </TableRow>
                      {expandedLpnId === lpn.id && (
                        <TableRow>
                          <TableCell colSpan={8} className='p-0'>
                            <div className='bg-muted/50 p-4'>
                              {childrenLoading ? (
                                <div className='space-y-2'><Skeleton className='h-10 w-full' /></div>
                              ) : childLpns && childLpns.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>LPN Number</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Location</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {childLpns.map((child) => (
                                      <TableRow key={child.id}>
                                        <TableCell className='font-medium'>{child.lpnNumber}</TableCell>
                                        <TableCell>{child.lpnType}</TableCell>
                                        <TableCell><StatusBadge status={child.status} /></TableCell>
                                        <TableCell>{child.locationId}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className='py-4 text-center text-sm text-muted-foreground'>No child LPNs</div>
                              )}
                              <div className='mt-3'>
                                <Button size='sm' variant='outline' onClick={() => { setNestingLpnId(expandedLpnId); setNestParentLpnId(''); setNestDialogOpen(true) }}>
                                  Nest LPN here
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Move LPN</DialogTitle>
            <DialogDescription>Enter the new location for this LPN.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='newLocation'>New Location ID *</Label>
              <Input id='newLocation' value={newLocationId} onChange={(e) => setNewLocationId(e.target.value)} placeholder='Enter location ID' />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button type='button' onClick={handleMove} disabled={!newLocationId || moveMutation.isPending}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LPN?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={nestDialogOpen} onOpenChange={setNestDialogOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Nest LPN</DialogTitle>
            <DialogDescription>Enter the parent LPN to nest the current LPN under.</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {nestingLpnId && (
              <div className='grid gap-2'>
                <Label>Child LPN (current)</Label>
                <Input value={lpns.find(l => l.id === nestingLpnId)?.lpnNumber ?? ''} disabled />
              </div>
            )}
            <div className='grid gap-2'>
              <Label htmlFor='parentLpnId'>Parent LPN ID *</Label>
              <Input id='parentLpnId' value={nestParentLpnId} onChange={(e) => setNestParentLpnId(e.target.value)} placeholder='Enter parent LPN ID' />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setNestDialogOpen(false)}>Cancel</Button>
            <Button type='button' onClick={async () => {
              if (!nestingLpnId || !nestParentLpnId) return
              try {
                await nestLpn.mutateAsync({ childId: nestingLpnId, parentId: nestParentLpnId })
                toast.success('LPN nested successfully')
                setNestDialogOpen(false)
                setNestingLpnId(null)
                setNestParentLpnId('')
                refetch()
              } catch (err: any) {
                toast.error(err?.response?.data?.message || err?.message || 'Nest failed')
              }
            }} disabled={!nestParentLpnId || nestLpn.isPending}>Nest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!unnestConfirmId} onOpenChange={() => setUnnestConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unnest LPN?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the LPN from its parent. This action can be undone by nesting again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!unnestConfirmId) return
              try {
                await unnestLpn.mutateAsync(unnestConfirmId)
                toast.success('LPN unnested successfully')
                setUnnestConfirmId(null)
                refetch()
              } catch (err: any) {
                toast.error(err?.response?.data?.message || err?.message || 'Unnest failed')
              }
            }}>Unnest</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
