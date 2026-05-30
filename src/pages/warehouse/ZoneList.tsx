
import { RefreshCw, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  useZones,
  useFacilities,
  type Zone,
} from '@/features/warehouse/data/warehouse-queries'
import { useFacility } from '@/hooks/useFacility'

export function ZoneList() {
  const { selectedFacility } = useFacility()
  const { data, isLoading, isError, error, refetch } = useZones()

  const { data: facilitiesData } = useFacilities()
  const facilities = facilitiesData?.facilities ?? []
  const zones = data?.zones ?? []
  const total = data?.total ?? 0

  const getFacilityName = (id: string | null | undefined) => {
    if (!id) return '—'
    const f = facilities.find((f) => f.id === id)
    return f ? f.facilityName : id
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground">
            Manage warehouse zones and areas
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <CardDescription>
            {total} zone{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedFacility ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">Select a facility to view zones</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Use the facility selector at the top of the page to choose a facility and display its zones.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load zones</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((z: Zone) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium">{z.zoneCode}</TableCell>
                      <TableCell>{z.zoneName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {z.zoneType || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getFacilityName(z.facilityId)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
