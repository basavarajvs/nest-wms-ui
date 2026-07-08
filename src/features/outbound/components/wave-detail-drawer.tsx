import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useWaveById,
  useReleaseWave,
  useCancelWave,
  useUpdateWave,
  WAVE_STATUS_LABELS,
  WAVE_TYPE_LABELS,
  WAVE_TYPE_OPTIONS,
} from '@/features/outbound/data/wave-queries'
import { DataTableLoading } from '@/components/data-table/data-table'
import { Loader2Icon } from 'lucide-react'

interface WaveDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  waveId: string | null
}

const editWaveSchema = z.object({
  wave_name: z.string().min(1, 'Wave name is required'),
  wave_type: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type EditWaveFormValues = z.infer<typeof editWaveSchema>

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case 'CREATED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'RELEASED':
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

export function WaveDetailDrawer({ open, onOpenChange, waveId }: WaveDetailDrawerProps) {
  const navigate = useNavigate()
  const { data: wave, isLoading } = useWaveById(waveId)
  const releaseMutation = useReleaseWave()
  const cancelMutation = useCancelWave()
  const updateMutation = useUpdateWave()

  const [editOpen, setEditOpen] = useState(false)

  const editForm = useForm<EditWaveFormValues>({
    resolver: zodResolver(editWaveSchema),
    defaultValues: { wave_name: '', wave_type: '', description: '', notes: '' },
  })

  useEffect(() => {
    if (editOpen && wave) {
      editForm.reset({
        wave_name: wave.wave_name ?? '',
        wave_type: wave.wave_type ?? '',
        description: wave.description ?? '',
        notes: wave.notes ?? '',
      })
    }
  }, [editOpen, wave, editForm])

  const orders = useMemo(() => {
    if (!wave?.orders) return []
    return wave.orders as unknown as { order_id?: string; order_number?: string; status?: string }[]
  }, [wave])

  const tasks = useMemo(() => {
    if (!wave?.tasks) return []
    return wave.tasks as unknown as { picking_task_id?: string; task_number?: string; status?: string }[]
  }, [wave])

  const isCreated = wave?.status === 'CREATED'
  const isPending = wave?.status === 'CREATED'
  const canCancel = wave?.status === 'CREATED' || wave?.status === 'RELEASED'
  const isActionLoading = releaseMutation.isPending || cancelMutation.isPending || updateMutation.isPending

  const handleRelease = () => {
    if (!waveId) return
    releaseMutation.mutate(waveId, { onSuccess: () => onOpenChange(false) })
  }

  const handleCancel = () => {
    if (!waveId) return
    cancelMutation.mutate(waveId, { onSuccess: () => onOpenChange(false) })
  }

  const handleEditSubmit = editForm.handleSubmit((values) => {
    if (!waveId) return
    updateMutation.mutate(
      { id: waveId, data: { wave_name: values.wave_name, wave_type: values.wave_type || undefined, description: values.description || undefined, notes: values.notes || undefined } },
      { onSuccess: () => setEditOpen(false) },
    )
  })

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Wave #{wave?.wave_number ?? ''}</SheetTitle>
            <SheetDescription>
              Picking wave details, orders, and tasks
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <DataTableLoading />
          ) : !wave ? (
            <p className="text-sm text-muted-foreground py-4">Wave not found.</p>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Wave #: </span>
                  <span className="font-medium">{wave.wave_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  {wave.wave_name ?? '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  {wave.wave_type ? (WAVE_TYPE_LABELS[wave.wave_type] ?? wave.wave_type) : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <Badge className={statusBadgeClass(wave.status)}>
                    {WAVE_STATUS_LABELS[wave.status ?? ''] ?? wave.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Orders: </span>
                  {wave.order_count ?? '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Tasks: </span>
                  {wave.total_tasks != null ? `${wave.completed_tasks ?? 0}/${wave.total_tasks}` : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {wave.created_date ? new Date(wave.created_date).toLocaleString() : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Facility: </span>
                  {wave.facility_name ?? '-'}
                </div>
                {wave.released_at && (
                  <div>
                    <span className="text-muted-foreground">Released: </span>
                    {new Date(wave.released_at).toLocaleString()}
                  </div>
                )}
                {wave.completed_at && (
                  <div>
                    <span className="text-muted-foreground">Completed: </span>
                    {new Date(wave.completed_at).toLocaleString()}
                  </div>
                )}
              </div>

              {wave.selection_criteria_json && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Selection Criteria: </span>
                  <pre className="mt-1 text-xs bg-muted p-2 rounded-md whitespace-pre-wrap">
                    {(() => {
                      try { return JSON.stringify(JSON.parse(wave.selection_criteria_json!), null, 2) }
                      catch { return wave.selection_criteria_json }
                    })()}
                  </pre>
                </div>
              )}

              {wave.description && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Description: </span>
                  {wave.description}
                </div>
              )}
              {wave.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  {wave.notes}
                </div>
              )}

              {orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Orders ({orders.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, idx) => (
                        <TableRow key={order.order_id ?? idx}>
                          <TableCell className="font-medium">{order.order_number ?? '-'}</TableCell>
                          <TableCell>{order.status ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {tasks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tasks ({tasks.length})</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task #</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task, idx) => (
                        <TableRow key={task.picking_task_id ?? idx}>
                          <TableCell className="font-medium">{task.task_number ?? '-'}</TableCell>
                          <TableCell>{task.status ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <SheetFooter className="border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              {isPending && (
                <Button variant="secondary" onClick={() => setEditOpen(true)} disabled={isActionLoading}>
                  Edit
                </Button>
              )}
              {canCancel && (
                <Button variant="destructive" onClick={handleCancel} disabled={isActionLoading}>
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Wave'}
                </Button>
              )}
              {isCreated && (
                <Button onClick={handleRelease} disabled={isActionLoading}>
                  {releaseMutation.isPending ? 'Releasing...' : 'Release Wave'}
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wave #{wave?.wave_number}</DialogTitle>
            <DialogDescription>Update wave metadata.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <FormField
                control={editForm.control}
                name="wave_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wave Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="wave_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wave Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WAVE_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{WAVE_TYPE_LABELS[opt]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
