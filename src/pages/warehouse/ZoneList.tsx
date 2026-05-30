import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCw, MapPin, Edit, Trash2 } from 'lucide-react'
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
  useZones,
  useFacilities,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
  type Zone,
} from '@/features/warehouse/data/warehouse-queries'
import { useFacility } from '@/hooks/useFacility'

const zoneSchema = z.object({
  zoneCode: z.string().min(1, 'Zone code is required'),
  name: z.string().min(1, 'Name is required'),
  zoneType: z.string().optional(),
  facilityId: z.string().min(1, 'Facility is required'),
  isActive: z.boolean().optional().default(true),
})

type ZoneForm = z.infer<typeof zoneSchema>

export function ZoneList() {
  const { selectedFacility } = useFacility()
  const { data, isLoading, isError, error, refetch } = useZones()
  const { data: facilitiesData } = useFacilities()
  const facilities = facilitiesData?.facilities ?? []
  const zones = data?.zones ?? []
  const total = data?.total ?? 0

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
    formState: { errors, isSubmitting },
  } = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema) as any,
    defaultValues: {
      zoneCode: '',
      name: '',
      zoneType: '',
      facilityId: selectedFacility?.id || '',
      isActive: true,
    },
  })

  const getFacilityName = (id: string | null | undefined) => {
    if (!id) return '—'
    const f = facilities.find((f) => f.id === id)
    return f ? f.facilityName : id
  }

  const openDialog = (zone?: Zone) => {
    if (zone) {
      setEditingZone(zone)
      reset({
        zoneCode: zone.zoneCode,
        name: zone.zoneName,
        zoneType: zone.zoneType || '',
        facilityId: zone.facilityId || selectedFacility?.id || '',
        isActive: true,
      })
    } else {
      setEditingZone(null)
      reset({
        zoneCode: '',
        name: '',
        zoneType: '',
        facilityId: selectedFacility?.id || '',
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ZoneForm) => {
    try {
      if (editingZone) {
        await updateMutation.mutateAsync({ id: editingZone.id, dto: values as any })
        toast.success('Zone updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Zone created')
      }
      setDialogOpen(false)
      setEditingZone(null)
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
      toast.success('Zone deleted')
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
          <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground">Manage warehouse zones and areas</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" /> New Zone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingZone ? 'Edit Zone' : 'Create New Zone'}</DialogTitle>
                  <DialogDescription>
                    {editingZone ? 'Update zone details.' : 'Add a new warehouse zone.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="zoneCode">Zone Code *</Label>
                    <Input id="zoneCode" {...register('zoneCode')} disabled={!!editingZone} />
                    {errors.zoneCode && <p className="text-sm text-destructive">{errors.zoneCode.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zoneType">Zone Type</Label>
                    <Input id="zoneType" {...register('zoneType')} placeholder="Storage, Picking, Shipping..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="facilityId">Facility ID</Label>
                    <Input id="facilityId" {...register('facilityId')} disabled />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                    {editingZone ? 'Save Changes' : 'Create Zone'}
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

      {selectedFacility && (
        <div className="rounded-md bg-muted px-4 py-2 text-sm text-muted-foreground">
          Showing zones for: <span className="font-medium text-foreground">{selectedFacility.facilityCode} — {selectedFacility.facilityName}</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Zone Master</CardTitle>
          <CardDescription>{total} zone{total !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFacility ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a facility to view zones</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load zones</p>
              <p className="text-sm text-muted-foreground">{(error as any)?.message || 'An unexpected error occurred'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No zones found for this facility</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Facility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((z: Zone) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium">{z.zoneCode}</TableCell>
                      <TableCell>{z.zoneName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{z.zoneType || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{getFacilityName(z.facilityId)}</Badge></TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(z)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(z.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <AlertDialogTitle>Delete Zone?</AlertDialogTitle>
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
