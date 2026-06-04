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
import { useZones, useAisles, useCreateAisle, useUpdateAisle, useDeleteAisle, type Aisle } from '@/features/warehouse/data/warehouse-queries'

const aisleSchema = z.object({
  code: z.string().min(1, 'Aisle code is required'),
  zoneId: z.string().min(1, 'Zone is required'),
})

type AisleForm = z.infer<typeof aisleSchema>

interface AisleManagementPageProps {
  facilityId: string
}

export function AisleManagementPage({ facilityId }: AisleManagementPageProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Aisle | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [selectedZoneId, setSelectedZoneId] = useState('')

  const { data: zonesData, isLoading: zonesLoading } = useZones(facilityId)
  const { data, isLoading, isError, error, refetch } = useAisles({ zoneId: selectedZoneId })

  const createMutation = useCreateAisle()
  const updateMutation = useUpdateAisle()
  const deleteMutation = useDeleteAisle()

  const zones = zonesData?.zones ?? []
  const items = data?.aisles ?? []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AisleForm>({
    resolver: zodResolver(aisleSchema) as any,
    defaultValues: { code: '', zoneId: '' },
  })

  const pagination = useMemo(() => ({ pageIndex, pageSize }), [pageIndex, pageSize])

  const columns: ColumnDef<Aisle, any>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Code' />,
        cell: ({ row }) => <span className='font-medium font-mono'>{row.getValue('code')}</span>,
      },
      {
        accessorKey: 'zoneName',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Zone' />,
        cell: ({ row }) => <span className='text-muted-foreground'>{row.original.zoneName || row.original.zoneId || '—'}</span>,
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

  const openDialog = (item?: Aisle) => {
    if (item) {
      setEditingItem(item)
      reset({ code: item.code, zoneId: item.zoneId })
    } else {
      setEditingItem(null)
      reset({ code: '', zoneId: selectedZoneId || '' })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: AisleForm) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, dto: values as any })
        toast.success('Aisle updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Aisle created')
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
      toast.success('Aisle deleted')
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
            <Select
              value={selectedZoneId}
              onValueChange={(v) => { setSelectedZoneId(v); setPagination({ pageIndex: 0, pageSize }) }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select a zone...' />
              </SelectTrigger>
              <SelectContent>
                {zonesLoading ? (
                  <SelectItem value='__loading__' disabled>Loading...</SelectItem>
                ) : zones.length === 0 ? (
                  <SelectItem value='__empty__' disabled>No zones found</SelectItem>
                ) : (
                  zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.zoneName} ({z.zoneCode})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button size='sm' onClick={() => openDialog()} disabled={!selectedZoneId}>
              <Plus className='mr-2 h-4 w-4' /> New Aisle
            </Button>
            <DialogContent className='sm:max-w-[480px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Aisle' : 'Create New Aisle'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update aisle details.' : 'Add a new aisle to the selected zone.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='code'>Aisle Code *</Label>
                    <Input id='code' {...register('code')} placeholder='e.g. A01' disabled={!!editingItem} />
                    {errors.code && <p className='text-sm text-destructive'>{errors.code.message}</p>}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='zoneId'>Zone *</Label>
                    <Select
                      value={editingItem?.zoneId || selectedZoneId}
                      onValueChange={(v) => setValue('zoneId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select zone...' />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>{z.zoneName} ({z.zoneCode})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.zoneId && <p className='text-sm text-destructive'>{errors.zoneId.message}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type='submit' disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingItem ? 'Save Changes' : 'Create Aisle'}
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
          <CardTitle>Aisles</CardTitle>
          <CardDescription>{items.length} aisle{items.length !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedZoneId ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>Select a zone to view its aisles</p>
            </div>
          ) : isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load aisles</p>
              <p className='text-sm text-muted-foreground'>{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No aisles found for this zone</p>
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
            <AlertDialogTitle>Delete Aisle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the aisle and all associated bays, racks, levels, and locations. This action cannot be undone.
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
