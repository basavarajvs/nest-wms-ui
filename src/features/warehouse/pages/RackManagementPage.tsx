import { useState, useMemo } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table'
import { Plus, RefreshCw, Edit, Trash2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { useRacks, useCreateRack, useUpdateRack, useDeleteRack, type Rack } from '@/features/warehouse/data/warehouse-queries'

const rackSchema = z.object({
  code: z.string().min(1, 'Rack code is required'),
  bayId: z.string().min(1, 'Bay is required'),
})

type RackForm = z.infer<typeof rackSchema>

interface RackManagementPageProps {
  facilityId: string
}

export function RackManagementPage({ facilityId: _facilityId }: RackManagementPageProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Rack | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectedBayId, setSelectedBayId] = useState('')
  const [bayInput, setBayInput] = useState('')

  const { data, isLoading, isError, error, refetch } = useRacks({ bayId: selectedBayId })

  const createMutation = useCreateRack()
  const updateMutation = useUpdateRack()
  const deleteMutation = useDeleteRack()

  const items = data?.racks ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RackForm>({
    resolver: zodResolver(rackSchema) as any,
    defaultValues: { code: '', bayId: '' },
  })

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const columns: ColumnDef<Rack, any>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-medium font-mono'>{row.getValue('code')}</span>,
      },
      {
        accessorKey: 'bayCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Bay' />,
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.bayCode || row.original.bayId || '—'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => (
          <Badge variant={row.getValue('isActive') !== false ? 'default' : 'secondary'}>
            {row.getValue('isActive') !== false ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button variant='ghost' size='icon' onClick={() => openDialog(item)}>
                <Edit className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={() => setDeleteId(item.id)}>
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const openDialog = (item?: Rack) => {
    if (item) {
      setEditingItem(item)
      reset({ code: item.code, bayId: item.bayId })
    } else {
      setEditingItem(null)
      reset({ code: '', bayId: selectedBayId || '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: RackForm) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto: { rackCode: values.code } })
        toast.success('Rack updated')
      } else {
        await createMutation.mutateAsync({ rackCode: values.code, bayId: values.bayId, facilityId, aisleId: values.bayId, zoneId: values.bayId })
        toast.success('Rack created')
      }
      setDialogOpen(false)
      setEditingItem(null)
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
      toast.success('Rack deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='w-[240px]'>
            <div className='flex gap-2'>
              <Input
                placeholder='Enter Bay ID...'
                value={bayInput}
                onChange={(e) => setBayInput(e.target.value)}
              />
              <Button
                size='sm'
                variant='secondary'
                onClick={() => { setSelectedBayId(bayInput); setPagination({ pageIndex: 0, pageSize }) }}
              >
                Load
              </Button>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size='sm' onClick={() => openDialog()} disabled={!selectedBayId}>
              <Plus className='mr-2 h-4 w-4' /> New Rack
            </Button>
            <DialogContent className='sm:max-w-[480px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Rack' : 'Create New Rack'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update rack details.' : 'Add a new rack to the selected bay.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='code'>Rack Code *</Label>
                    <Input id='code' {...register('code')} placeholder='e.g. R01' disabled={!!editingItem} />
                    {errors.code && <p className='text-sm text-destructive'>{errors.code.message}</p>}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='bayId'>Bay ID *</Label>
                    <Input id='bayId' {...register('bayId')} placeholder='Enter bay ID...' disabled={!!editingItem} />
                    {errors.bayId && <p className='text-sm text-destructive'>{errors.bayId.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? 'Save Changes' : 'Create Rack'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Button variant='outline' size='sm' onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Racks</CardTitle>
          <CardDescription>{items.length} rack{items.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedBayId ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>Select a bay to view its racks</p>
            </div>
          ) : isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load racks</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No racks found for this bay</p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination table={table} className='mt-4' />
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rack?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the rack and all associated levels and locations. This action cannot be undone.
            </AlertDialogDescription>
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
