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
import { Plus, RefreshCw, Building2, Edit, Trash2 } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  useFacilities,
  useCreateFacility,
  useUpdateFacility,
  useDeleteFacility,
  type Facility,
} from '@/features/warehouse/data/warehouse-queries'

const facilitySchema = z.object({
  facilityCode: z.string().min(1, 'Facility code is required'),
  name: z.string().min(1, 'Name is required'),
  facilityType: z.string().min(1, 'Type is required'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  timezoneName: z.string().default('UTC'),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type FacilityForm = z.infer<typeof facilitySchema>

const TIMEZONE_OPTIONS = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland',
] as const

const FACILITY_TYPE_OPTIONS = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
  { value: 'CROSS_DOCK', label: 'Cross Dock' },
  { value: 'FULFILLMENT_CENTER', label: 'Fulfillment Center' },
  { value: 'MANUFACTURING_PLANT', label: 'Manufacturing Plant' },
  { value: 'RETAIL_STORE', label: 'Retail Store' },
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'HAZMAT_FACILITY', label: 'Hazmat Facility' },
  { value: 'STORAGE_FACILITY', label: 'Storage Facility' },
] as const

export function FacilityList() {
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
  const { data, isLoading, isError, error, refetch } = useFacilities('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const createMutation = useCreateFacility()
  const updateMutation = useUpdateFacility()
  const deleteMutation = useDeleteFacility()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FacilityForm>({
    resolver: zodResolver(facilitySchema) as any,
    defaultValues: {
      facilityCode: '',
      name: '',
      facilityType: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      timezoneName: 'UTC',
      description: '',
      isActive: true,
    },
  })

  const facilities = data?.facilities ?? []

  const columns: ColumnDef<Facility, any>[] = useMemo(
    () => [
      {
        accessorKey: 'facilityCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Code' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('facilityCode')}</span>
        ),
      },
      {
        accessorKey: 'facilityName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
      },
      {
        accessorKey: 'facilityType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('facilityType') || '—'}
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
          const f = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button variant='ghost' size='icon' onClick={() => openDialog(f)}>
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDeleteId(f.id)}
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
    data: facilities,
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

  const openDialog = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility)
      reset({
        facilityCode: facility.facilityCode,
        name: facility.facilityName,
        facilityType: facility.facilityType || '',
        addressLine1: (facility as any).addressLine1 || '',
        addressLine2: (facility as any).addressLine2 || '',
        city: (facility as any).city || '',
        state: (facility as any).state || '',
        postalCode: (facility as any).postalCode || '',
        country: (facility as any).country || '',
        contactName: (facility as any).contactName || '',
        contactEmail: (facility as any).contactEmail || '',
        contactPhone: (facility as any).contactPhone || '',
        timezoneName: (facility as any).timezoneName || 'UTC',
        description: (facility as any).description || '',
        isActive: facility.isActive !== false,
      })
    } else {
      setEditingFacility(null)
      reset({
        facilityCode: '', name: '', facilityType: '',
        addressLine1: '', addressLine2: '', city: '', state: '',
        postalCode: '', country: '', contactName: '', contactEmail: '',
        contactPhone: '', timezoneName: 'UTC', description: '',
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: FacilityForm) => {
    try {
      if (editingFacility) {
        await updateMutation.mutateAsync({
          id: editingFacility.id,
          dto: values as any,
        })
        toast.success('Facility updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Facility created')
      }
      setDialogOpen(false)
      setEditingFacility(null)
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
      toast.success('Facility deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Facilities</h1>
          <p className='text-muted-foreground'>
            Manage warehouses and storage facilities
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size='sm' onClick={() => openDialog()}>
                <Plus className='mr-2 h-4 w-4' /> New Facility
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[520px]'>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>
                    {editingFacility ? 'Edit Facility' : 'Create New Facility'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingFacility
                      ? 'Update facility details.'
                      : 'Add a new warehouse facility.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='facilityCode'>Facility Code *</Label>
                    <Input
                      id='facilityCode'
                      {...register('facilityCode')}
                      disabled={!!editingFacility}
                    />
                    {errors.facilityCode && (
                      <p className='text-sm text-destructive'>
                        {errors.facilityCode.message}
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
                    <Label htmlFor='facilityType'>Facility Type *</Label>
                    <Select
                      onValueChange={(val) => setValue('facilityType', val)}
                      value={watch('facilityType')}
                    >
                      <SelectTrigger id='facilityType'>
                        <SelectValue placeholder='Select facility type...' />
                      </SelectTrigger>
                      <SelectContent>
                        {FACILITY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.facilityType && (
                      <p className='text-sm text-destructive'>
                        {errors.facilityType.message}
                      </p>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='addressLine1'>Address Line 1</Label>
                      <Input id='addressLine1' {...register('addressLine1')} placeholder='Street address' />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='addressLine2'>Address Line 2</Label>
                      <Input id='addressLine2' {...register('addressLine2')} placeholder='Suite, unit, etc.' />
                    </div>
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='city'>City</Label>
                      <Input id='city' {...register('city')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='state'>State/Province</Label>
                      <Input id='state' {...register('state')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='postalCode'>Postal Code</Label>
                      <Input id='postalCode' {...register('postalCode')} />
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='country'>Country</Label>
                    <Input id='country' {...register('country')} placeholder='e.g. US' />
                  </div>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='contactName'>Contact Name</Label>
                      <Input id='contactName' {...register('contactName')} />
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='contactEmail'>Contact Email</Label>
                      <Input id='contactEmail' {...register('contactEmail')} type='email' />
                      {errors.contactEmail && (
                        <p className='text-sm text-destructive'>{errors.contactEmail.message}</p>
                      )}
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='contactPhone'>Contact Phone</Label>
                      <Input id='contactPhone' {...register('contactPhone')} />
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='timezoneName'>Timezone</Label>
                    <Select
                      onValueChange={(val) => setValue('timezoneName', val)}
                      value={watch('timezoneName')}
                    >
                      <SelectTrigger id='timezoneName'>
                        <SelectValue placeholder='Select timezone...' />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='description'>Description</Label>
                    <Textarea
                      id='description'
                      {...register('description')}
                      placeholder='Facility description...'
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      {...register('isActive')}
                      id='isActive'
                    />
                    <Label htmlFor='isActive'>Active</Label>
                  </div>
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
                    {editingFacility ? 'Save Changes' : 'Create Facility'}
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

      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by code or name...'
      />

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Facility Master</CardTitle>
          <CardDescription>
            {facilities.length} facilit{facilities.length !== 1 ? 'ies' : 'y'}{' '}
            found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load facilities
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
              <Building2 className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No facilities found</p>
              {tableUrlState.globalFilter && (
                <p className='text-sm text-muted-foreground'>
                  Try adjusting your search term
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facility?</AlertDialogTitle>
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
