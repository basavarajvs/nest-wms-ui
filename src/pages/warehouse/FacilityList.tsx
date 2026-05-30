import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, RefreshCw, Building2, Edit, Trash2 } from 'lucide-react'
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
  isActive: z.boolean().optional().default(true),
})

type FacilityForm = z.infer<typeof facilitySchema>

export function FacilityList() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, error, refetch } = useFacilities(search)

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
    formState: { errors, isSubmitting },
  } = useForm<FacilityForm>({
    resolver: zodResolver(facilitySchema) as any,
    defaultValues: { facilityCode: '', name: '', facilityType: '', isActive: true },
  })

  const facilities = data?.facilities ?? []
  const total = data?.total ?? 0

  const openDialog = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility)
      reset({
        facilityCode: facility.facilityCode,
        name: facility.facilityName,
        facilityType: facility.facilityType || '',
        isActive: facility.isActive !== false,
      })
    } else {
      setEditingFacility(null)
      reset({ facilityCode: '', name: '', facilityType: '', isActive: true })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: FacilityForm) => {
    try {
      if (editingFacility) {
        await updateMutation.mutateAsync({ id: editingFacility.id, dto: values as any })
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
      toast.error(err?.response?.data?.message || err?.message || 'Operation failed')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground">Manage warehouses and storage facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" /> New Facility
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingFacility ? 'Edit Facility' : 'Create New Facility'}</DialogTitle>
                  <DialogDescription>
                    {editingFacility ? 'Update facility details.' : 'Add a new warehouse facility.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="facilityCode">Facility Code *</Label>
                    <Input id="facilityCode" {...register('facilityCode')} disabled={!!editingFacility} />
                    {errors.facilityCode && <p className="text-sm text-destructive">{errors.facilityCode.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="facilityType">Facility Type *</Label>
                    <Input id="facilityType" {...register('facilityType')} placeholder="Warehouse, Distribution Center..." />
                    {errors.facilityType && <p className="text-sm text-destructive">{errors.facilityType.message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" {...register('isActive')} id="isActive" />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingFacility ? 'Save Changes' : 'Create Facility'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by code or name..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Facility Master</CardTitle>
          <CardDescription>{total} facilit{total !== 1 ? 'ies' : 'y'} found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load facilities</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : facilities.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No facilities found</p>
              {search && (<p className="text-sm text-muted-foreground">Try adjusting your search term</p>)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((f: Facility) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.facilityCode}</TableCell>
                      <TableCell>{f.facilityName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{f.facilityType || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={f.isActive !== false ? 'default' : 'secondary'}>
                          {f.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(f)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facility?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
