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
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { DataTablePagination } from '@/components/data-table/pagination'
import { useAisles, useBays, useCreateBay, useUpdateBay, useDeleteBay, type Bay } from '@/features/warehouse/data/warehouse-queries'

const baySchema = z.object({
  code: z.string().min(1, 'Bay code is required'),
  aisleId: z.string().min(1, 'Aisle is required'),
})

type BayForm = z.infer<typeof baySchema>

interface BayManagementPageProps {
  facilityId: string
}

export function BayManagementPage({ facilityId: _facilityId }: BayManagementPageProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Bay | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [selectedAisleId, setSelectedAisleId] = useState('')

  const { data: aislesData } = useAisles({ zoneId: selectedZoneId })
  const { data, isLoading, isError, error, refetch } = useBays({ aisleId: selectedAisleId })

  const createMutation = useCreateBay()
  const updateMutation = useUpdateBay()
  const deleteMutation = useDeleteBay()

  const aisles = aislesData?.aisles ?? []
  const items = data?.bays ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BayForm>({
    resolver: zodResolver(baySchema) as any,
    defaultValues: { code: '', aisleId: '' },
  })

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const columns: ColumnDef<Bay, any>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-medium font-mono'>{row.getValue('code')}</span>,
      },
      {
        accessorKey: 'aisleCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Aisle' />,
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.aisleCode || row.original.aisleId || '—'}</span>,
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

  const openDialog = (item?: Bay) => {
    if (item) {
      setEditingItem(item)
      reset({ code: item.code, aisleId: item.aisleId })
    } else {
      setEditingItem(null)
      reset({ code: '', aisleId: selectedAisleId || '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: BayForm) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto: values as any })
        toast.success('Bay updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Bay created')
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
      toast.success('Bay deleted')
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
          <div className='w-[200px]'>
            <Select value={selectedZoneId} onValueChange={(v) => { setSelectedZoneId(v); setSelectedAisleId(''); setPagination({ pageIndex: 0, pageSize }) }}>
              <SelectTrigger><SelectValue placeholder='Select zone...' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='__all__'>All Zones</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='w-[240px]'>
            <Select value={selectedAisleId} onValueChange={(v) => { setSelectedAisleId(v); setPagination({ pageIndex: 0, pageSize }) }}>
              <SelectTrigger><SelectValue placeholder='Select an aisle...' /></SelectTrigger>
              <SelectContent>
                {aisles.length === 0 ? (
                  <SelectItem value='__empty__' disabled>No aisles found</SelectItem>
                ) : (
                  aisles.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.code}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size='sm' onClick={() => openDialog()} disabled={!selectedAisleId}>
              <Plus className='mr-2 h-4 w-4' /> New Bay
            </Button>
            <DialogContent className='sm:max-w-[480px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Bay' : 'Create New Bay'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update bay details.' : 'Add a new bay to the selected aisle.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='code'>Bay Code *</Label>
                    <Input id='code' {...register('code')} placeholder='e.g. B01' disabled={!!editingItem} />
                    {errors.code && <p className='text-sm text-destructive'>{errors.code.message}</p>}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='aisleId'>Aisle *</Label>
                    <Select value={editingItem?.aisleId || selectedAisleId} onValueChange={(v) => setValue('aisleId', v)}>
                      <SelectTrigger><SelectValue placeholder='Select aisle...' /></SelectTrigger>
                      <SelectContent>
                        {aisles.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.aisleId && <p className='text-sm text-destructive'>{errors.aisleId.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? 'Save Changes' : 'Create Bay'}
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
          <CardTitle>Bays</CardTitle>
          <CardDescription>{items.length} bay{items.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedAisleId ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>Select an aisle to view its bays</p>
            </div>
          ) : isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load bays</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No bays found for this aisle</p>
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
            <AlertDialogTitle>Delete Bay?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the bay and all associated racks, levels, and locations. This action cannot be undone.
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
