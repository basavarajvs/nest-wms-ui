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
import { useLevels, useCreateLevel, useUpdateLevel, useDeleteLevel, type Level } from '@/features/warehouse/data/warehouse-queries'

const levelSchema = z.object({
  code: z.string().min(1, 'Level code is required'),
  rackId: z.string().min(1, 'Rack is required'),
})

type LevelForm = z.infer<typeof levelSchema>

interface LevelManagementPageProps {
  facilityId: string
}

export function LevelManagementPage({ facilityId: _facilityId }: LevelManagementPageProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Level | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectedRackId, setSelectedRackId] = useState('')
  const [rackInput, setRackInput] = useState('')

  const { data, isLoading, isError, error, refetch } = useLevels({ rackId: selectedRackId })

  const createMutation = useCreateLevel()
  const updateMutation = useUpdateLevel()
  const deleteMutation = useDeleteLevel()

  const items = data?.levels ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LevelForm>({
    resolver: zodResolver(levelSchema) as any,
    defaultValues: { code: '', rackId: '' },
  })

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const columns: ColumnDef<Level, any>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-medium font-mono'>{row.getValue('code')}</span>,
      },
      {
        accessorKey: 'rackCode',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Rack' />,
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.rackCode || row.original.rackId || '—'}</span>,
      },
      {
        accessorKey: 'locationPrefix',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Loc. Prefix' />,
        cell: ({ row }) => <span className='font-mono text-xs text-muted-foreground'>{row.original.locationPrefix || '—'}</span>,
      },
      {
        accessorKey: 'locationsPerLevel',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Locations' />,
        cell: ({ row }) => <span>{row.original.locationsPerLevel ?? '—'}</span>,
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

  const openDialog = (item?: Level) => {
    if (item) {
      setEditingItem(item)
      reset({ code: item.code, rackId: item.rackId })
    } else {
      setEditingItem(null)
      reset({ code: '', rackId: selectedRackId || '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: LevelForm) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto: { levelCode: values.code } })
        toast.success('Level updated')
      } else {
        await createMutation.mutateAsync({ levelCode: values.code, rackId: values.rackId, facilityId, aisleId: values.rackId, bayId: values.rackId, zoneId: values.rackId })
        toast.success('Level created')
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
      toast.success('Level deleted')
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
                placeholder='Enter Rack ID...'
                value={rackInput}
                onChange={(e) => setRackInput(e.target.value)}
              />
              <Button
                size='sm'
                variant='secondary'
                onClick={() => { setSelectedRackId(rackInput); setPagination({ pageIndex: 0, pageSize }) }}
              >
                Load
              </Button>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size='sm' onClick={() => openDialog()} disabled={!selectedRackId}>
              <Plus className='mr-2 h-4 w-4' /> New Level
            </Button>
            <DialogContent className='sm:max-w-[480px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Level' : 'Create New Level'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update level details.' : 'Add a new level to the selected rack.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='code'>Level Code *</Label>
                    <Input id='code' {...register('code')} placeholder='e.g. L01' disabled={!!editingItem} />
                    {errors.code && <p className='text-sm text-destructive'>{errors.code.message}</p>}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='rackId'>Rack ID *</Label>
                    <Input id='rackId' {...register('rackId')} placeholder='Enter rack ID...' disabled={!!editingItem} />
                    {errors.rackId && <p className='text-sm text-destructive'>{errors.rackId.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? 'Save Changes' : 'Create Level'}
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
          <CardTitle>Levels</CardTitle>
          <CardDescription>{items.length} level{items.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRackId ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>Select a rack to view its levels</p>
            </div>
          ) : isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load levels</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No levels found for this rack</p>
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
            <AlertDialogTitle>Delete Level?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the level and all associated locations. This action cannot be undone.
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
