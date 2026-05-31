import { useState, useMemo, useCallback } from 'react'
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
import {
  Plus,
  Edit,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useLocations,
  useLocationChildren,
  useCreateLocation,
  useUpdateLocation,
  useZones,
  type Location,
} from '@/features/warehouse/data/warehouse-queries'

const createLocationSchema = z.object({
  zoneId: z.string().min(1, 'Zone is required'),
  locationCode: z.string().min(1, 'Location code is required'),
  locationType: z.string().min(1, 'Location type is required'),
  parentLocationId: z.string().optional(),
})

const updateLocationSchema = z.object({
  isActive: z.boolean(),
  parentLocationId: z.string().optional(),
})

type CreateLocationForm = z.infer<typeof createLocationSchema>
type UpdateLocationForm = z.infer<typeof updateLocationSchema>

const LOCATION_TYPES = [
  'BIN',
  'RACK',
  'SHELF',
  'AISLE',
  'BAY',
  'LEVEL',
  'SLOT',
  'DOCK',
  'STAGING',
  'BULK',
]

export function LocationList() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = router.state.location.search as Record<string, unknown>

  const tableUrlState = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'q' },
  })
  const [parentId, setParentId] = useState<string | null>(null)
  const [locationChain, setLocationChain] = useState<Location[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [editLocation, setEditLocation] = useState<Location | null>(null)

  const { data: rootData, isLoading, isError, error, refetch } = useLocations()
  const { data: childrenData, isLoading: childrenLoading } =
    useLocationChildren(parentId)
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const { selectedFacility } = useFacility()
  const { data: zonesData } = useZones()

  const zones = zonesData?.zones ?? []
  const allLocations = rootData?.locations ?? []
  const displayLocations = parentId
    ? (childrenData?.locations ?? [])
    : allLocations

  const createForm = useForm<CreateLocationForm>({
    resolver: zodResolver(createLocationSchema) as any,
    defaultValues: {
      zoneId: '',
      locationCode: '',
      locationType: '',
      parentLocationId: '',
    },
  })

  const updateForm = useForm<UpdateLocationForm>({
    resolver: zodResolver(updateLocationSchema) as any,
    defaultValues: { isActive: true, parentLocationId: '' },
  })

  const filteredZones = selectedFacility
    ? zones.filter((z) => z.facilityId === selectedFacility.id)
    : zones

  const getZoneName = useCallback(
    (zoneId: string | null | undefined) => {
      if (!zoneId) return '—'
      const z = zones.find((z) => z.id === zoneId)
      return z?.zoneCode || zoneId
    },
    [zones]
  )

  const columns: ColumnDef<Location, any>[] = useMemo(
    () => [
      {
        accessorKey: 'locationCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Code' />
        ),
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              onClick={() => drillDown(row.original)}
              title='View children'
            >
              <ChevronRight className='h-3 w-3' />
            </Button>
            <span className='font-medium'>{row.getValue('locationCode')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'locationName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('locationName') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'locationType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <Badge variant='outline' className='font-mono text-xs'>
            {row.getValue('locationType') || '—'}
          </Badge>
        ),
      },
      {
        id: 'zone',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Zone' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {getZoneName(row.original.zoneId)}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.getValue('isActive') !== false ? 'default' : 'secondary'
            }
          >
            {row.getValue('isActive') !== false ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const loc = row.original
          return (
            <div className='flex items-center justify-end gap-1'>
              <Button variant='ghost' size='icon' onClick={() => openEdit(loc)}>
                <Edit className='h-4 w-4' />
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: displayLocations,
    columns,
    state: {
      globalFilter: tableUrlState.globalFilter ?? '',
      pagination: tableUrlState.pagination,
    },
    onGlobalFilterChange: tableUrlState.onGlobalFilterChange,
    onPaginationChange: tableUrlState.onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const openCreate = useCallback(() => {
    createForm.reset({
      zoneId: '',
      locationCode: '',
      locationType: '',
      parentLocationId: parentId || '',
    })
    setCreateOpen(true)
  }, [createForm, parentId])

  const openEdit = useCallback(
    (loc: Location) => {
      setEditLocation(loc)
      updateForm.reset({
        isActive: loc.isActive !== false,
        parentLocationId: loc.parentLocationId || '',
      })
    },
    [updateForm]
  )

  const onCreateSubmit = useCallback(
    async (values: CreateLocationForm) => {
      if (!selectedFacility) {
        toast.error('Please select a facility from the top bar first')
        return
      }
      try {
        await createMutation.mutateAsync({
          facilityId: selectedFacility.id,
          zoneId: values.zoneId,
          locationCode: values.locationCode,
          locationType: values.locationType,
          parentLocationId: values.parentLocationId || undefined,
        } as any)
        toast.success('Location created successfully')
        setCreateOpen(false)
        createForm.reset()
        refetch()
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to create location'
        )
      }
    },
    [createMutation, createForm, refetch, selectedFacility]
  )

  const onUpdateSubmit = useCallback(
    async (values: UpdateLocationForm) => {
      if (!editLocation) return
      try {
        await updateMutation.mutateAsync({
          id: editLocation.id,
          dto: {
            isActive: values.isActive,
            parentId: values.parentLocationId || undefined,
          } as any,
        })
        toast.success('Location updated successfully')
        setEditLocation(null)
        refetch()
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to update location'
        )
      }
    },
    [editLocation, updateMutation, refetch]
  )

  const drillDown = useCallback((loc: Location) => {
    setParentId(loc.id)
    setLocationChain((prev) => [...prev, loc])
  }, [])

  const goUp = useCallback(() => {
    setLocationChain((prev) => {
      const next = [...prev]
      next.pop()
      setParentId(next.length > 0 ? next[next.length - 1].id : null)
      return next
    })
  }, [])

  const resetHierarchy = useCallback(() => {
    setParentId(null)
    setLocationChain([])
  }, [])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Storage Locations
          </h1>
          <p className='text-muted-foreground'>
            Manage storage locations with hierarchical structure
          </p>
        </div>
        <div className='flex items-center gap-2'>
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
          <Button onClick={openCreate}>
            <Plus className='mr-2 h-4 w-4' /> New Location
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-4'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='Search by code, name, or type...'
        />
        {locationChain.length > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <Button variant='ghost' size='sm' onClick={resetHierarchy}>
              All Locations
            </Button>
            <ChevronRight className='h-3 w-3 text-muted-foreground' />
            {locationChain.map((loc, i) => (
              <span key={loc.id} className='flex items-center gap-1'>
                {i > 0 && (
                  <ChevronRight className='h-3 w-3 text-muted-foreground' />
                )}
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    const newChain = locationChain.slice(0, i + 1)
                    setLocationChain(newChain)
                    setParentId(loc.id)
                  }}
                >
                  {loc.locationCode}
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Location Explorer</CardTitle>
              <CardDescription>
                {parentId
                  ? `Children of ${locationChain[locationChain.length - 1]?.locationCode || 'parent'}`
                  : `${displayLocations.length} root location${displayLocations.length !== 1 ? 's' : ''} found`}
              </CardDescription>
            </div>
            {parentId && (
              <Button variant='outline' size='sm' onClick={goUp}>
                <ArrowLeft className='mr-2 h-4 w-4' /> Back to Parent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || (parentId && childrenLoading) ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load locations
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
              <Layers className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No locations found</p>
              {parentId && (
                <p className='text-sm text-muted-foreground'>
                  This location has no children
                </p>
              )}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Location</DialogTitle>
              <DialogDescription>Add a new storage location</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              {selectedFacility && (
                <div className='grid gap-2'>
                  <Label>Facility</Label>
                  <div className='flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground'>
                    {selectedFacility.facilityName} (
                    {selectedFacility.facilityCode})
                  </div>
                </div>
              )}
              <div className='grid gap-2'>
                <Label>Zone *</Label>
                <Select
                  value={createForm.watch('zoneId')}
                  onValueChange={(v) => createForm.setValue('zoneId', v)}
                  disabled={!selectedFacility}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        filteredZones.length ? 'Select zone' : 'No zones'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredZones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>
                        {z.zoneName} ({z.zoneCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.formState.errors.zoneId && (
                  <p className='text-sm text-destructive'>
                    {createForm.formState.errors.zoneId.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label>Location Code *</Label>
                <Input
                  {...createForm.register('locationCode')}
                  placeholder='e.g. A-01-01'
                />
                {createForm.formState.errors.locationCode && (
                  <p className='text-sm text-destructive'>
                    {createForm.formState.errors.locationCode.message}
                  </p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label>Location Type *</Label>
                <Select
                  value={createForm.watch('locationType')}
                  onValueChange={(v) => createForm.setValue('locationType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label>Parent Location</Label>
                <Select
                  value={createForm.watch('parentLocationId') || ''}
                  onValueChange={(v) =>
                    createForm.setValue('parentLocationId', v || '')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='None (root level)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>None (root level)</SelectItem>
                    {allLocations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.locationCode}
                        {l.locationName ? ` - ${l.locationName}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editLocation}
        onOpenChange={(open) => !open && setEditLocation(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>
                {editLocation?.locationCode} — Update location settings
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label>Code</Label>
                  <p className='pt-1 text-sm font-medium'>
                    {editLocation?.locationCode}
                  </p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className='pt-1 text-sm font-medium'>
                    {editLocation?.locationType || '—'}
                  </p>
                </div>
              </div>
              <div className='grid gap-2'>
                <Label>Status</Label>
                <Select
                  value={updateForm.watch('isActive') ? 'active' : 'inactive'}
                  onValueChange={(v) =>
                    updateForm.setValue('isActive', v === 'active')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='grid gap-2'>
                <Label>Parent Location</Label>
                <Select
                  value={updateForm.watch('parentLocationId') || ''}
                  onValueChange={(v) =>
                    updateForm.setValue('parentLocationId', v || '')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='No parent (root)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>No parent (root level)</SelectItem>
                    {allLocations
                      .filter((l) => l.id !== editLocation?.id)
                      .map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.locationCode}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setEditLocation(null)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
