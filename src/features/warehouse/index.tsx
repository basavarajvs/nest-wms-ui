import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useFacilities,
  useZones,
  useLocations,
  useCreateLocation,
  useUpdateLocation,
  type Facility,
  type Zone,
  type Location,
} from './data/warehouse-queries'

// Simple schemas (expand as needed based on real DTOs)
const locationSchema = z.object({
  locationCode: z.string().min(1, 'Location code is required'),
  locationName: z.string().optional(),
  locationType: z.string().optional(),
})

type LocationForm = z.infer<typeof locationSchema>

export function Warehouse() {
  const [activeTab, setActiveTab] = useState<
    'facilities' | 'zones' | 'locations'
  >('facilities')

  // Data fetching
  const { data: facilitiesData, isLoading: facilitiesLoading, error: facilitiesError, refetch: refetchFacilities } = useFacilities()
  const { data: zonesData, isLoading: zonesLoading, error: zonesError, refetch: refetchZones } = useZones()
  const { data: locationsData, isLoading: locationsLoading, error: locationsError, refetch: refetchLocations } = useLocations()

  const facilities = facilitiesData?.facilities ?? []
  const zones = zonesData?.zones ?? []
  const locations = locationsData?.locations ?? []

  // Location create/update (we have good support for locations)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  const createLocationMutation = useCreateLocation()
  const updateLocationMutation = useUpdateLocation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: { locationCode: '', locationName: '', locationType: '' },
  })

  const openLocationDialog = (loc?: Location) => {
    if (loc) {
      setEditingLocation(loc)
      reset({
        locationCode: loc.locationCode,
        locationName: loc.locationName || '',
        locationType: loc.locationType || '',
      })
    } else {
      setEditingLocation(null)
      reset({ locationCode: '', locationName: '', locationType: '' })
    }
    setLocationDialogOpen(true)
  }

  const onLocationSubmit = async (values: LocationForm) => {
    try {
      if (editingLocation) {
        await updateLocationMutation.mutateAsync({
          id: editingLocation.id,
          dto: values as any,
        })
        toast.success('Location updated')
      } else {
        await createLocationMutation.mutateAsync(values as any)
        toast.success('Location created')
      }
      setLocationDialogOpen(false)
      setEditingLocation(null)
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed')
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          Warehouse Structure
        </h1>
        <p className='text-muted-foreground'>
          Manage Facilities, Zones, and Storage Locations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='facilities'>Facilities</TabsTrigger>
          <TabsTrigger value='zones'>Zones</TabsTrigger>
          <TabsTrigger value='locations'>Locations</TabsTrigger>
        </TabsList>

        {/* Facilities */}
        <TabsContent value='facilities'>
          <Card>
            <CardHeader>
              <CardTitle>Facilities (Warehouses)</CardTitle>
            </CardHeader>
            <CardContent>
              {facilitiesLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : facilitiesError ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-destructive font-medium">Failed to load facilities</p>
                  <Button variant="outline" size="sm" onClick={() => refetchFacilities()}>Retry</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facilities.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className='py-8 text-center text-muted-foreground'
                        >
                          No facilities found
                        </TableCell>
                      </TableRow>
                    )}
                    {facilities.map((f: Facility) => (
                      <TableRow key={f.id}>
                        <TableCell className='font-medium'>
                          {f.facilityCode}
                        </TableCell>
                        <TableCell>{f.facilityName}</TableCell>
                        <TableCell>{f.facilityType || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              f.isActive !== false ? 'default' : 'secondary'
                            }
                          >
                            {f.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zones */}
        <TabsContent value='zones'>
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Zones</CardTitle>
            </CardHeader>
            <CardContent>
              {zonesLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : zonesError ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-destructive font-medium">Failed to load zones</p>
                  <Button variant="outline" size="sm" onClick={() => refetchZones()}>Retry</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Facility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className='py-8 text-center text-muted-foreground'
                        >
                          No zones found
                        </TableCell>
                      </TableRow>
                    )}
                    {zones.map((z: Zone) => (
                      <TableRow key={z.id}>
                        <TableCell className='font-medium'>
                          {z.zoneCode}
                        </TableCell>
                        <TableCell>{z.zoneName}</TableCell>
                        <TableCell>{z.zoneType || '—'}</TableCell>
                        <TableCell className='text-muted-foreground'>
                          {z.facilityId || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations */}
        <TabsContent value='locations'>
          <div className='mb-4 flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold'>Storage Locations</h3>
            </div>
            <Dialog
              open={locationDialogOpen}
              onOpenChange={setLocationDialogOpen}
            >
              <DialogTrigger asChild>
                <Button onClick={() => openLocationDialog()}>
                  <Plus className='mr-2 h-4 w-4' /> New Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit(onLocationSubmit)}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? 'Edit Location' : 'Create Location'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className='grid gap-4 py-4'>
                    <div>
                      <Label>Location Code *</Label>
                      <Input
                        {...register('locationCode')}
                        disabled={!!editingLocation}
                      />
                      {errors.locationCode && (
                        <p className='text-sm text-destructive'>
                          {errors.locationCode.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Location Name</Label>
                      <Input {...register('locationName')} />
                    </div>
                    <div>
                      <Label>Location Type</Label>
                      <Input
                        {...register('locationType')}
                        placeholder='BIN, RACK, etc.'
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => setLocationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type='submit' disabled={isSubmitting}>
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className='pt-6'>
              {locationsLoading ? (
                <div className='space-y-2'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : locationsError ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-destructive font-medium">Failed to load locations</p>
                  <Button variant="outline" size="sm" onClick={() => refetchLocations()}>Retry</Button>
                </div>
              ) : locations.length === 0 ? (
                <div className='py-10 text-center text-muted-foreground'>
                  No locations found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc: Location) => (
                      <TableRow key={loc.id}>
                        <TableCell className='font-medium'>
                          {loc.locationCode}
                        </TableCell>
                        <TableCell>{loc.locationName || '—'}</TableCell>
                        <TableCell>{loc.locationType || '—'}</TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => openLocationDialog(loc)}
                          >
                            <Edit2 className='h-4 w-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
