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
import { Plus, Edit, Trash2, Users } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
  useCustomerList,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
} from './data/customer-queries'

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'E_COMMERCE', label: 'E-Commerce' },
  { value: 'OTHER', label: 'Other' },
] as const

const customerSchema = z.object({
  customerCode: z.string().min(1, 'Customer code is required'),
  name: z.string().min(1, 'Name is required'),
  customerType: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryPhone: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  shippingAddressLine1: z.string().optional(),
  shippingAddressLine2: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCountry: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type CustomerForm = z.infer<typeof customerSchema>

export function Customers() {
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

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useCustomerList()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      customerCode: '',
      name: '',
      customerType: '',
      primaryContactName: '',
      primaryEmail: '',
      primaryPhone: '',
      billingAddressLine1: '',
      billingAddressLine2: '',
      billingCity: '',
      billingState: '',
      billingPostalCode: '',
      billingCountry: '',
      shippingAddressLine1: '',
      shippingAddressLine2: '',
      shippingCity: '',
      shippingState: '',
      shippingPostalCode: '',
      shippingCountry: '',
      isActive: true,
    },
  })

  const customers = data?.customers ?? []

  const columns: ColumnDef<Customer, any>[] = useMemo(
    () => [
      {
        accessorKey: 'customerCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Code' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('customerCode')}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
      },
      {
        accessorKey: 'customerType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Type' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('customerType') || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'primaryEmail',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Email' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('primaryEmail') || '—'}
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
          const customer = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button variant='ghost' size='icon' onClick={() => openDialog(customer)}>
                <Edit className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={() => setDeleteId(customer.id)}>
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
    data: customers,
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

  const openDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      reset({
        customerCode: customer.customerCode,
        name: customer.name,
        customerType: customer.customerType || '',
        primaryContactName: customer.primaryContactName || '',
        primaryEmail: customer.primaryEmail || '',
        primaryPhone: customer.primaryPhone || '',
        billingAddressLine1: customer.billingAddressLine1 || '',
        billingAddressLine2: customer.billingAddressLine2 || '',
        billingCity: customer.billingCity || '',
        billingState: customer.billingState || '',
        billingPostalCode: customer.billingPostalCode || '',
        billingCountry: customer.billingCountry || '',
        shippingAddressLine1: customer.shippingAddressLine1 || '',
        shippingAddressLine2: customer.shippingAddressLine2 || '',
        shippingCity: customer.shippingCity || '',
        shippingState: customer.shippingState || '',
        shippingPostalCode: customer.shippingPostalCode || '',
        shippingCountry: customer.shippingCountry || '',
        isActive: customer.isActive !== false,
      })
    } else {
      setEditingCustomer(null)
      reset({
        customerCode: '', name: '', customerType: '',
        primaryContactName: '', primaryEmail: '', primaryPhone: '',
        billingAddressLine1: '', billingAddressLine2: '',
        billingCity: '', billingState: '', billingPostalCode: '', billingCountry: '',
        shippingAddressLine1: '', shippingAddressLine2: '',
        shippingCity: '', shippingState: '', shippingPostalCode: '', shippingCountry: '',
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: CustomerForm) => {
    try {
      if (editingCustomer) {
        await updateMutation.mutateAsync({
          id: editingCustomer.id,
          dto: values as any,
        })
        toast.success('Customer updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Customer created')
      }
      setDialogOpen(false)
      setEditingCustomer(null)
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
      toast.success('Customer deleted')
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
          <h1 className='text-2xl font-bold tracking-tight'>Customers</h1>
          <p className='text-muted-foreground'>
            Manage customer accounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[600px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? 'Edit Customer' : 'Create New Customer'}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? 'Update the customer details below.'
                    : 'Add a new customer to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='customerCode'>Customer Code *</Label>
                    <Input
                      id='customerCode'
                      {...register('customerCode')}
                      disabled={!!editingCustomer}
                    />
                    {errors.customerCode && (
                      <p className='text-sm text-destructive'>{errors.customerCode.message}</p>
                    )}
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='name'>Name *</Label>
                    <Input id='name' {...register('name')} />
                    {errors.name && (
                      <p className='text-sm text-destructive'>{errors.name.message}</p>
                    )}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='customerType'>Customer Type</Label>
                    <Select
                      onValueChange={(val) => setValue('customerType', val)}
                      value={watch('customerType')}
                    >
                      <SelectTrigger id='customerType'>
                        <SelectValue placeholder='Select type...' />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMER_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='primaryPhone'>Phone</Label>
                    <Input id='primaryPhone' {...register('primaryPhone')} />
                  </div>
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='primaryContactName'>Contact Name</Label>
                  <Input id='primaryContactName' {...register('primaryContactName')} />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='primaryEmail'>Email</Label>
                  <Input id='primaryEmail' {...register('primaryEmail')} type='email' />
                  {errors.primaryEmail && (
                    <p className='text-sm text-destructive'>{errors.primaryEmail.message}</p>
                  )}
                </div>

                <div className='rounded-md border p-3'>
                  <p className='mb-2 text-sm font-medium'>Billing Address</p>
                  <div className='grid gap-3'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingAddressLine1'>Address Line 1</Label>
                        <Input id='billingAddressLine1' {...register('billingAddressLine1')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingAddressLine2'>Address Line 2</Label>
                        <Input id='billingAddressLine2' {...register('billingAddressLine2')} />
                      </div>
                    </div>
                    <div className='grid grid-cols-4 gap-3'>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingCity'>City</Label>
                        <Input id='billingCity' {...register('billingCity')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingState'>State</Label>
                        <Input id='billingState' {...register('billingState')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingPostalCode'>Postal Code</Label>
                        <Input id='billingPostalCode' {...register('billingPostalCode')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='billingCountry'>Country</Label>
                        <Input id='billingCountry' {...register('billingCountry')} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='rounded-md border p-3'>
                  <p className='mb-2 text-sm font-medium'>Shipping Address</p>
                  <div className='grid gap-3'>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingAddressLine1'>Address Line 1</Label>
                        <Input id='shippingAddressLine1' {...register('shippingAddressLine1')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingAddressLine2'>Address Line 2</Label>
                        <Input id='shippingAddressLine2' {...register('shippingAddressLine2')} />
                      </div>
                    </div>
                    <div className='grid grid-cols-4 gap-3'>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingCity'>City</Label>
                        <Input id='shippingCity' {...register('shippingCity')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingState'>State</Label>
                        <Input id='shippingState' {...register('shippingState')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingPostalCode'>Postal Code</Label>
                        <Input id='shippingPostalCode' {...register('shippingPostalCode')} />
                      </div>
                      <div className='grid gap-2'>
                        <Label htmlFor='shippingCountry'>Country</Label>
                        <Input id='shippingCountry' {...register('shippingCountry')} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Switch
                    checked={watch('isActive')}
                    onCheckedChange={(v) => setValue('isActive', v)}
                    id='isActive'
                  />
                  <Label htmlFor='isActive'>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                >
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableToolbar table={table} searchPlaceholder='Search customers...' />

      <Card>
        <CardHeader>
          <CardTitle>Customer Master</CardTitle>
          <CardDescription>{customers.length} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : error ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>Failed to load customers</p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>Retry</Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <Users className='h-12 w-12 text-muted-foreground/50' />
              <p className='text-muted-foreground'>No customers found.</p>
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
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
