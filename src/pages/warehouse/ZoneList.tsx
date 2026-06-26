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
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { Plus, RefreshCw, MapPin, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { DataTableToolbar } from '@/components/data-table/toolbar'
import {
  useZones,
  useFacilities,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
  type Zone,
} from '@/features/warehouse/data/warehouse-queries'

const zoneSchema = z.object({
  zoneCode: z.string().min(1, 'Zone code is required'),
  name: z.string().min(1, 'Name is required'),
  zoneType: z.string().optional(),
  description: z.string().optional(),
  zoneColorHex: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type ZoneForm = z.infer<typeof zoneSchema>

const ZONE_TYPE_OPTIONS = [
  { value: 'BULK', label: 'Bulk' },
  { value: 'PICKING', label: 'Picking' },
  { value: 'RECEIVING', label: 'Receiving' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'STAGING', label: 'Staging' },
  { value: 'QC', label: 'Quality Control' },
  { value: 'HOLD', label: 'Hold' },
  { value: 'YARD', label: 'Yard' },
  { value: 'RACK', label: 'Rack' },
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'HAZMAT', label: 'Hazmat' },
  { value: 'QUALITY_HOLD', label: 'Quality Hold' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'RETURNS', label: 'Returns' },
] as const

export function ZoneList() {
  const [sorting, setSorting] = useState<SortingState>([])
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const { selectedFacility } = useFacility()
  const { data, isLoading, isError, error, refetch } = useZones()
  const { data: facilitiesData } = useFacilities()
  const facilities = facilitiesData?.facilities ?? []
  const zones = data?.zones ?? []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const createMutation = useCreateZone()
  const updateMutation = useUpdateZone()
  const deleteMutation = useDeleteZone()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema) as any,
    defaultValues: { zoneCode: '', name: '', zoneType: '', description: '', zoneColorHex: '', isActive: true },
  })

  const getFacilityName = (id: string | null | undefined) => {
    if (!id) return '—'
    const f = facilities.find((f) => f.id === id)
    return f ? f.facilityName : id
  }

  const columns: ColumnDef<Zone, any>[] = useMemo(
    () => [
      {
        accessorKey: 'zoneCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Code' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('zoneCode')}</span>
        ),
      },
      {
        accessorKey: 'zoneName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
      },
      {
        accessorKey: 'zoneType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('zoneType') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'facilityId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Facility' />
        ),
        cell: ({ row }) => (
          <Badge variant='outline'>
            {getFacilityName(row.getValue('facilityId'))}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const z = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button variant='ghost' size='icon' onClick={() => openDialog(z)}>
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDeleteId(z.id)}
              >
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
    data: zones,
    columns,
    state: {
      sorting,
      globalFilter: tableUrlState.globalFilter ?? '',
      pagination: tableUrlState.pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const openDialog = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone)
      reset({
        zoneCode: zone.zoneCode,
        name: zone.zoneName,
        zoneType: zone.zoneType || '',
        description: (zone as any).description || '',
        zoneColorHex: (zone as any).zoneColorHex || '',
        isActive: true,
      })
    } else {
      setEditingZone(null)
      reset({ zoneCode: '', name: '', zoneType: '', description: '', zoneColorHex: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ZoneForm) => {
    try {
      if (editingZone) {
        await updateMutation.mutateAsync({
          id: editingZone.id,
          dto: { ...values, facilityId: selectedFacility?.id } as any,
        })
        toast.success('Zone updated')
      } else {
        await createMutation.mutateAsync({
          ...values,
          facilityId: selectedFacility?.id,
        } as any)
        toast.success('Zone created')
      }
      setDialogOpen(false)
      setEditingZone(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Zone deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Zones</h1>
          <p className='text-muted-foreground'>
            Manage warehouse zones and areas
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size='sm' onClick={() => openDialog()}>
                <Plus className='mr-2 h-4 w-4' /> New Zone
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[520px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? 'Edit Zone' : 'Create New Zone'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingZone
                      ? 'Update zone details.'
                      : 'Add a new warehouse zone.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='zoneCode'>Zone Code *</Label>
                    <Input
                      id='zoneCode'
                      {...register('zoneCode')}
                      disabled={!!editingZone}
                    />
                    {errors.zoneCode && (
                      <p className='text-sm text-destructive'>
                        {errors.zoneCode.message}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='name'>Name *</Label>
                    <Input id='name' {...register('name')} />
                    {errors.name && (
                      <p className='text-sm text-destructive'>
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='zoneType'>Zone Type</Label>
                    <Select
                      onValueChange={(val) => setValue('zoneType', val)}
                      value={watch('zoneType')}
                    >
                      <SelectTrigger id='zoneType'>
                        <SelectValue placeholder='Select zone type...' />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      {...register('description')}
                      placeholder='Zone description...'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='zoneColorHex'>Zone Color</Label>
                    <div className='flex gap-2'>
                      <Input
                        id='zoneColorHex'
                        {...register('zoneColorHex')}
                        placeholder='#FF5733'
                        className='flex-1'
                      />
                      {watch('zoneColorHex') && (
                        <div
                          className='h-9 w-9 rounded-md border'
                          style={{ backgroundColor: watch('zoneColorHex') }}
                        />
                      )}
                    </div>
                  </div>
                  {selectedFacility && (
                    <div className='rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground'>
                      Facility:{' '}
                      <span className='font-medium text-foreground'>
                        {selectedFacility.facilityCode} —{' '}
                        {selectedFacility.facilityName}
                      </span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      isSubmitting ||
                      createMutation.isPending ||
                      updateMutation.isPending
                    }
                  >
                    {editingZone ? 'Save Changes' : 'Create Zone'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />{' '}
            Refresh
          </Button>
        </div>
      </div>

      {selectedFacility && (
        <div className='rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground'>
          Showing zones for:{' '}
          <span className='font-medium text-foreground'>
            {selectedFacility.facilityCode} — {selectedFacility.facilityName}
          </span>
        </div>
      )}

      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by code, name, or type...'
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Zone Master</CardTitle>
          <CardDescription>
            {zones.length} zone{zones.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFacility ? (
            <div className='flex flex-col items-center gap-3 py-12 text-center'>
              <MapPin className='h-12 w-12 text-muted-foreground/30' />
              <p className='text-muted-foreground'>
                Select a facility to view zones
              </p>
            </div>
          ) : isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load zones
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <MapPin className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>
                No zones found for this facility
              </p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
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
            <AlertDialogTitle>Delete Zone?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
