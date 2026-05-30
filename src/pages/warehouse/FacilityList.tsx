import { useState, useCallback } from 'react'
import { Search, RefreshCw, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  useFacilities,
  type Facility,
} from '@/features/warehouse/data/warehouse-queries'

export function FacilityList() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, error, refetch } = useFacilities(search)

  const facilities = data?.facilities ?? []
  const total = data?.total ?? 0

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground">
            Manage warehouses and storage facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Facility Master</CardTitle>
          <CardDescription>
            {total} facilit{total !== 1 ? 'ies' : 'y'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load facilities</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : facilities.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No facilities found</p>
              {search && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search term
                </p>
              )}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((f: Facility) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">
                        {f.facilityCode}
                      </TableCell>
                      <TableCell>{f.facilityName}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {f.facilityType || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.isActive !== false ? 'default' : 'secondary'}>
                          {f.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
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
