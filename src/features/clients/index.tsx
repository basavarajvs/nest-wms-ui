import { useState, useMemo, useCallback } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useRouter } from '@tanstack/react-router'
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
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTableUrlState } from '@/hooks/use-table-url-state'
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
import { useFacilities } from '@/features/warehouse/data/warehouse-queries'
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useClientFacilityAssignments,
  useCreateClientFacilityAssignment,
  useUpdateClientFacilityAssignment,
  useDeleteClientFacilityAssignment,
  type Client,
  type ClientFacilityAssignment,
} from './data/client-queries'

const clientSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().optional().default(true),
})

type ClientForm = z.infer<typeof clientSchema>

const assignmentSchema = z.object({
  facilityId: z.string().min(1, 'Facility is required'),
  effectiveAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type AssignmentForm = z.infer<typeof assignmentSchema>

export function Clients() {
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
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [editingAssignment, setEditingAssignment] =
    useState<ClientFacilityAssignment | null>(null)
  const [deleteAssignmentId, setDeleteAssignmentId] = useState<string | null>(
    null
  )

  const { data, isLoading, error, refetch } = useClients()
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()

  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    refetch: refetchAssignments,
  } = useClientFacilityAssignments(
    selectedClientId ? { clientId: selectedClientId } : undefined
  )
  const createAssignMutation = useCreateClientFacilityAssignment()
  const updateAssignMutation = useUpdateClientFacilityAssignment()
  const deleteAssignMutation = useDeleteClientFacilityAssignment()

  const { data: facilitiesData } = useFacilities()
  const facilities = facilitiesData?.facilities ?? []

  const assignments = assignmentsData?.assignments ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      clientCode: '',
      name: '',
      isActive: true,
    },
  })

  const {
    register: assignRegister,
    handleSubmit: handleAssignSubmit,
    reset: resetAssign,
    watch: watchAssign,
    setValue: setValueAssign,
    formState: { errors: assignErrors, isSubmitting: isAssignSubmitting },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema) as any,
    defaultValues: {
      facilityId: '',
      effectiveAt: '',
      expiresAt: '',
      isActive: true,
    },
  })

  const clients = data?.clients ?? []

  const getFacilityName = useCallback(
    (id: string) => {
      const f = facilities.find((f) => f.id === id)
      return f ? `${f.facilityCode} — ${f.facilityName}` : id
    },
    [facilities]
  )

  const columns: ColumnDef<Client, any>[] = useMemo(
    () => [
      {
        accessorKey: 'clientCode',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Code' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>{row.getValue('clientCode')}</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Name' />
        ),
        size: 250,
        minSize: 200,
        maxSize: 350,
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
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const client = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setSelectedClientId(client.id)
                  setAssignDialogOpen(true)
                }}
              >
                <Building2 className='mr-1 h-4 w-4' /> Assign
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => openDialog(client)}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDeleteId(client.id)}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          )
        },
        size: 140,
        minSize: 120,
        maxSize: 180,
      },
    ],
    []
  )

  const assignColumns: ColumnDef<ClientFacilityAssignment, any>[] = useMemo(
    () => [
      {
        id: 'facility',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Facility' />
        ),
        cell: ({ row }) => (
          <span className='font-medium'>
            {getFacilityName(row.original.facilityId)}
          </span>
        ),
        size: 200,
        minSize: 180,
        maxSize: 250,
      },
      {
        accessorKey: 'effectiveAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Effective' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('effectiveAt') || '—'}
          </span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
      },
      {
        accessorKey: 'expiresAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title='Expires' />
        ),
        cell: ({ row }) => (
          <span className='text-muted-foreground'>
            {row.getValue('expiresAt') || '—'}
          </span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 140,
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
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className='space-x-2 text-right'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => openEditAssignment(a)}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setDeleteAssignmentId(a.id)}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>
          )
        },
        size: 100,
        minSize: 80,
        maxSize: 120,
      },
    ],
    [getFacilityName]
  )

  const assignTable = useReactTable({
    data: assignments,
    columns: assignColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const table = useReactTable({
    data: clients,
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

  const openDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      reset({
        clientCode: client.clientCode,
        name: client.name,
        isActive: client.isActive !== false,
      })
    } else {
      setEditingClient(null)
      reset({ clientCode: '', name: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const openEditAssignment = (assignment: ClientFacilityAssignment) => {
    setEditingAssignment(assignment)
    resetAssign({
      facilityId: assignment.facilityId,
      effectiveAt: assignment.effectiveAt || '',
      expiresAt: assignment.expiresAt || '',
      isActive: assignment.isActive !== false,
    })
  }

  const onSubmit = async (values: ClientForm) => {
    try {
      if (editingClient) {
        await updateMutation.mutateAsync({
          id: editingClient.id,
          dto: values as any,
        })
        toast.success('Client updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Client created')
      }
      setDialogOpen(false)
      setEditingClient(null)
      reset()
      refetch()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Operation failed'
      )
    }
  }

  const onAssignSubmit = async (values: AssignmentForm) => {
    if (!selectedClientId) return
    try {
      if (editingAssignment) {
        await updateAssignMutation.mutateAsync({
          id: editingAssignment.id,
          dto: {
            effectiveAt: values.effectiveAt || undefined,
            expiresAt: values.expiresAt || undefined,
            isActive: values.isActive,
          },
        })
        toast.success('Assignment updated')
      } else {
        await createAssignMutation.mutateAsync({
          clientId: selectedClientId,
          facilityId: values.facilityId,
          effectiveAt: values.effectiveAt || undefined,
          expiresAt: values.expiresAt || undefined,
          isActive: values.isActive,
        })
        toast.success('Assignment created')
      }
      resetAssign({
        facilityId: '',
        effectiveAt: '',
        expiresAt: '',
        isActive: true,
      })
      setEditingAssignment(null)
      refetchAssignments()
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
      toast.success('Client deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleDeleteAssignment = async () => {
    if (!deleteAssignmentId) return
    try {
      await deleteAssignMutation.mutateAsync(deleteAssignmentId)
      toast.success('Assignment deleted')
      setDeleteAssignmentId(null)
      refetchAssignments()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const selectedClientName = selectedClientId
    ? clients.find((c) => c.id === selectedClientId)?.name || selectedClientId
    : ''

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Clients</h1>
          <p className='text-muted-foreground'>
            Manage warehouse client accounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className='mr-2 h-4 w-4' /> New Client
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[520px]'>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Edit Client' : 'Create New Client'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient
                    ? 'Update the client details below.'
                    : 'Add a new client to the system.'}
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='clientCode'>Client Code *</Label>
                  <Input
                    id='clientCode'
                    {...register('clientCode')}
                    disabled={!!editingClient}
                  />
                  {errors.clientCode && (
                    <p className='text-sm text-destructive'>
                      {errors.clientCode.message}
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
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTableToolbar table={table} searchPlaceholder='Search clients...' />

      <Card>
        <CardHeader>
          <CardTitle>Client Master</CardTitle>
          <CardDescription>{clients.length} clients</CardDescription>
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
              <p className='font-medium text-destructive'>
                Failed to load clients
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : table.getRowModel().rows.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No clients found.
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

      <Dialog
        open={!!selectedClientId && assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (!open) setSelectedClientId(null)
        }}
      >
        <DialogContent className='sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>Facility Assignments</DialogTitle>
            <DialogDescription>
              {selectedClientName} — Manage which facilities this client has
              access to
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <form
              onSubmit={handleAssignSubmit(onAssignSubmit)}
              className='space-y-3 rounded-md border p-4'
            >
              <p className='text-sm font-medium'>
                {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
              </p>
              <div className='grid gap-3'>
                {!editingAssignment && (
                  <div className='grid gap-2'>
                    <Label>Facility *</Label>
                    <Select
                      value={watchAssign('facilityId')}
                      onValueChange={(v) => setValueAssign('facilityId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select facility...' />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.facilityCode} — {f.facilityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignErrors.facilityId && (
                      <p className='text-sm text-destructive'>
                        {assignErrors.facilityId.message}
                      </p>
                    )}
                  </div>
                )}
                <div className='grid grid-cols-2 gap-3'>
                  <div className='grid gap-2'>
                    <Label htmlFor='effectiveAt'>Effective Date</Label>
                    <Input
                      id='effectiveAt'
                      type='date'
                      {...assignRegister('effectiveAt')}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='expiresAt'>Expires</Label>
                    <Input
                      id='expiresAt'
                      type='date'
                      {...assignRegister('expiresAt')}
                    />
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    {...assignRegister('isActive')}
                    id='assignIsActive'
                  />
                  <Label htmlFor='assignIsActive'>Active</Label>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  type='submit'
                  size='sm'
                  disabled={
                    isAssignSubmitting ||
                    createAssignMutation.isPending ||
                    updateAssignMutation.isPending
                  }
                >
                  {editingAssignment ? 'Save' : 'Add Assignment'}
                </Button>
                {editingAssignment && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setEditingAssignment(null)
                      resetAssign({
                        facilityId: '',
                        effectiveAt: '',
                        expiresAt: '',
                        isActive: true,
                      })
                    }}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>

            {assignmentsLoading ? (
              <div className='space-y-2'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className='h-10 w-full' />
                ))}
              </div>
            ) : assignments.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                No facility assignments yet.
              </p>
            ) : (
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    {assignTable.getHeaderGroups().map((headerGroup) => (
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
                    {assignTable.getRowModel().rows.map((row) => (
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
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedClientId(null)
                setEditingAssignment(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteAssignmentId}
        onOpenChange={() => setDeleteAssignmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className='bg-destructive'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
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
