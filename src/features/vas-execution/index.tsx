import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronRight, Loader2, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  useVasServiceList,
} from '@/features/vas-catalog/data/vas-catalog-queries'
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
  useVasTasks,
  useCreateVasTask,
  useUpdateVasTask,
  useDeleteVasTask,
  useVasTaskEvents,
  useAddVasTaskEvent,
  type VasTask,
} from './data/vas-queries'

const vasSchema = z.object({
  taskType: z.string().min(1, 'Task type is required'),
  facilityId: z.string().min(1, 'Facility ID is required'),
  serviceId: z.string().optional(),
  orderId: z.string().optional(),
  shipmentId: z.string().optional(),
  productId: z.string().optional(),
  quantityRequired: z.coerce.number().optional(),
  uomId: z.string().optional(),
  ratePerUnit: z.coerce.number().optional(),
  priority: z.coerce.number().optional(),
  notes: z.string().optional(),
})

type VasForm = z.infer<typeof vasSchema>

export function VasExecution() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<VasTask | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)

  const { data, isLoading, error, refetch } = useVasTasks()
  const { data: servicesData } = useVasServiceList({ isActive: 'true' })
  const services = servicesData?.services || []
  const createMutation = useCreateVasTask()
  const updateMutation = useUpdateVasTask()
  const deleteMutation = useDeleteVasTask()
  const { data: eventsData, isLoading: eventsLoading } = useVasTaskEvents(expandedTaskId ?? '')
  const addEventMutation = useAddVasTaskEvent()
  const [eventForm, setEventForm] = useState({ eventType: '', description: '', notes: '' })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VasForm>({
    resolver: zodResolver(vasSchema) as any,
    defaultValues: {
      taskType: '',
      facilityId: '',
      serviceId: '',
      orderId: '',
      shipmentId: '',
      productId: '',
      quantityRequired: undefined,
      uomId: '',
      ratePerUnit: undefined,
      priority: undefined,
      notes: '',
    },
  })

  const tasks = data?.tasks ?? []
  const filtered = tasks.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.taskType.toLowerCase().includes(q) || (t.orderId && t.orderId.toLowerCase().includes(q))
  })
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const openDialog = (task?: VasTask) => {
    if (task) {
      setEditingTask(task)
      reset({
        taskType: task.taskType,
        facilityId: task.facilityId,
        serviceId: task.serviceId || '',
        orderId: task.orderId || '',
        shipmentId: task.shipmentId || '',
        productId: task.productId || '',
        quantityRequired: task.quantityRequired,
        uomId: task.uomId || '',
        ratePerUnit: task.ratePerUnit,
        priority: task.priority,
        notes: task.notes || '',
      })
    } else {
      setEditingTask(null)
      reset({ taskType: '', facilityId: '', orderId: '', shipmentId: '', productId: '', quantityRequired: undefined, uomId: '', ratePerUnit: undefined, priority: undefined, notes: '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: VasForm) => {
    try {
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, dto: values as any })
        toast.success('VAS task updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('VAS task created')
      }
      setDialogOpen(false)
      setEditingTask(null)
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
      toast.success('VAS task deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleAddEvent = async () => {
    if (!expandedTaskId) return
    try {
      await addEventMutation.mutateAsync({ taskId: expandedTaskId, dto: eventForm })
      toast.success('Event added')
      setEventDialogOpen(false)
      setEventForm({ eventType: '', description: '', notes: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to add event')
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>VAS Execution</h1>
          <p className='text-muted-foreground'>Manage value-added service tasks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New VAS Task
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Edit VAS Task' : 'Create New VAS Task'}</DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Update the VAS task details below.' : 'Add a new value-added service task to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='taskType'>Task Type *</Label>
                  <Input id='taskType' {...register('taskType')} />
                  {errors.taskType && <p className='text-sm text-destructive'>{errors.taskType.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='facilityId'>Facility ID *</Label>
                  <Input id='facilityId' {...register('facilityId')} />
                  {errors.facilityId && <p className='text-sm text-destructive'>{errors.facilityId.message}</p>}
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='serviceId'>VAS Service</Label>
                  <Select onValueChange={(v) => { register('serviceId').onChange({ target: { name: 'serviceId', value: v } }); setValue('serviceId', v) }}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a service...' />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.serviceCode} – {s.serviceName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='orderId'>Order ID</Label>
                  <Input id='orderId' {...register('orderId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='shipmentId'>Shipment ID</Label>
                  <Input id='shipmentId' {...register('shipmentId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='productId'>Product ID</Label>
                  <Input id='productId' {...register('productId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='quantityRequired'>Quantity Required</Label>
                  <Input id='quantityRequired' type='number' {...register('quantityRequired')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='uomId'>UOM ID</Label>
                  <Input id='uomId' {...register('uomId')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='ratePerUnit'>Rate Per Unit</Label>
                  <Input id='ratePerUnit' type='number' step='any' {...register('ratePerUnit')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='priority'>Priority</Label>
                  <Input id='priority' type='number' {...register('priority')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Input id='notes' {...register('notes')} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative max-w-sm flex-1'>
        <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Search VAS tasks...' className='pl-9' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VAS Execution</CardTitle>
          <CardDescription>{total} tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-destructive font-medium'>Failed to load VAS tasks</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>No VAS tasks found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-10'></TableHead>
                    <TableHead>Task Type</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Button variant='ghost' size='icon' onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                          {expandedTaskId === task.id ? <ChevronDown className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>{task.taskType}</TableCell>
                      <TableCell>{task.facilityId}</TableCell>
                      <TableCell>{task.orderId || '—'}</TableCell>
                      <TableCell>{task.productId || '—'}</TableCell>
                      <TableCell>{task.quantityRequired ?? '—'}</TableCell>
                      <TableCell>{task.priority ?? '—'}</TableCell>
                      <TableCell><Badge variant='outline'>{task.status || 'Pending'}</Badge></TableCell>
                      <TableCell className='space-x-2 text-right'>
                        <Button variant='ghost' size='icon' onClick={() => openDialog(task)}><Edit className='h-4 w-4' /></Button>
                        <Button variant='ghost' size='icon' onClick={() => setDeleteId(task.id)}><Trash2 className='h-4 w-4 text-destructive' /></Button>
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

      {expandedTaskId && (
        <Card className="mt-4">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Task Events</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setEventDialogOpen(true)}>
                <Plus className="mr-1 h-3 w-3" /> Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {eventsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
            ) : eventsData?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">No events recorded</p>
            ) : (
              <div className="space-y-0">
                {eventsData?.map((event: any, idx: number) => (
                  <div key={event.id || idx} className="flex gap-3 pb-4 last:pb-0 relative">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      {idx < (eventsData?.length ?? 0) - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.eventType}</span>
                        <span className="text-xs text-muted-foreground">{event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}</span>
                      </div>
                      {event.description && <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>}
                      {event.performedBy && <p className="text-xs text-muted-foreground mt-0.5">by {event.performedBy}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
            <DialogDescription>Record a new event for this VAS task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Input id="eventType" value={eventForm.eventType} onChange={(e) => setEventForm((f) => ({ ...f, eventType: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={eventForm.notes} onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEventDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEvent} disabled={!eventForm.eventType || addEventMutation.isPending}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete VAS Task?</AlertDialogTitle>
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
