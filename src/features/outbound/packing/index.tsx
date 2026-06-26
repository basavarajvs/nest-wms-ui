import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Package,
  Box,
  Play,
  StopCircle,
  ScanLine,
  CheckCircle2,
  Scale,
} from 'lucide-react'
import { toast } from 'sonner'
import { useFacility } from '@/hooks/useFacility'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  usePackingStations,
} from '@/features/packing-stations/data/packing-station-queries'
import {
  useStartSession,
  useScanItem,
  useSealContainer,
  useCloseSession,
  useContainers,
} from './data/packing-queries'

const sessionSchema = z.object({
  stationCode: z.string().min(1, 'Station is required'),
})

const scanSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  lpn: z.string().optional(),
})

const containerSchema = z.object({
  containerId: z.string().min(1, 'Container ID is required'),
  weight: z.coerce.number().optional(),
})

type SessionForm = z.infer<typeof sessionSchema>
type ScanForm = z.infer<typeof scanSchema>
type ContainerForm = z.infer<typeof containerSchema>

export function PackingStationPanel() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const { selectedFacility } = useFacility()

  const { data: stationsData, isLoading: stationsLoading } = usePackingStations()
  const stations = stationsData?.packingStations ?? []

  const { data: containers, isLoading: containersLoading } = useContainers(activeSessionId || undefined)
  const startSession = useStartSession()
  const scanItem = useScanItem()
  const sealContainer = useSealContainer()
  const closeSession = useCloseSession()

  const {
    register: registerSession,
    handleSubmit: handleSessionSubmit,
    formState: { errors: sessionErrors },
  } = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema) as any,
  })

  const {
    register: registerScan,
    handleSubmit: handleScanSubmit,
    reset: resetScan,
    formState: { errors: scanErrors, isSubmitting: isScanSubmitting },
  } = useForm<ScanForm>({
    resolver: zodResolver(scanSchema) as any,
    defaultValues: { productCode: '', quantity: 1, lpn: '' },
  })

  const {
    register: registerContainer,
    handleSubmit: handleContainerSubmit,
    reset: resetContainer,
    formState: { errors: containerErrors },
  } = useForm<ContainerForm>({
    resolver: zodResolver(containerSchema) as any,
  })

  const onStartSession = useCallback(async (values: SessionForm) => {
    if (!selectedFacility?.id) {
      toast.error('Please select a facility first.')
      return
    }
    try {
      const res = await startSession.mutateAsync({
        stationCode: values.stationCode,
        facilityId: selectedFacility.id,
      }) as any
      const sessionId = res?.id || res?.sessionId || ''
      if (sessionId) {
        setActiveSessionId(sessionId)
        toast.success('Packing session started')
      } else {
        toast.error('Session started but no ID returned')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start session')
    }
  }, [selectedFacility, startSession])

  const onScanItem = useCallback(async (values: ScanForm) => {
    if (!activeSessionId) return
    try {
      await scanItem.mutateAsync({
        sessionId: activeSessionId,
        dto: {
          productCode: values.productCode,
          quantity: values.quantity,
          lpn: values.lpn || undefined,
        },
      })
      toast.success('Item scanned')
      resetScan({ productCode: '', quantity: 1, lpn: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Scan failed')
    }
  }, [activeSessionId, scanItem, resetScan])

  const onSealContainer = useCallback(async (values: ContainerForm) => {
    try {
      await sealContainer.mutateAsync({
        containerId: values.containerId,
        weight: values.weight,
      })
      toast.success('Container sealed')
      resetContainer({ containerId: '', weight: undefined })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to seal container')
    }
  }, [sealContainer, resetContainer])

  const onCloseSession = useCallback(async () => {
    if (!activeSessionId) return
    try {
      await closeSession.mutateAsync(activeSessionId)
      toast.success('Packing session closed')
      setActiveSessionId(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to close session')
    }
  }, [activeSessionId, closeSession])

  if (!activeSessionId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Packing Station</h1>
            <p className="text-muted-foreground">Start a packing session to begin scanning items</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-500" />
              Start New Session
            </CardTitle>
            <CardDescription>Select a packing station to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSessionSubmit(onStartSession)} className="space-y-4">
              {stationsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="stationCode">Packing Station *</Label>
                  <Input
                    id="stationCode"
                    list="stations"
                    placeholder="Select or type station code..."
                    {...registerSession('stationCode')}
                  />
                  <datalist id="stations">
                    {stations.filter((s) => s.isAvailable !== false).map((s) => (
                      <option key={s.id} value={s.stationCode} />
                    ))}
                  </datalist>
                  {sessionErrors.stationCode && (
                    <p className="text-sm text-destructive">{sessionErrors.stationCode.message}</p>
                  )}
                </div>
              )}

              <Button type="submit" disabled={startSession.isPending || stationsLoading}>
                <Play className="mr-2 h-4 w-4" />
                Start Session
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Stations</CardTitle>
            <CardDescription>{stations.filter((s) => s.isAvailable !== false).length} available</CardDescription>
          </CardHeader>
          <CardContent>
            {stationsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : stations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No packing stations configured.</p>
            ) : (
              <div className="grid gap-2">
                {stations.filter((s) => s.isAvailable !== false).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{s.stationCode}</p>
                      <p className="text-xs text-muted-foreground">{s.stationName || '—'}</p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packing Session</h1>
          <p className="font-mono text-xs text-muted-foreground">Session: {activeSessionId.substring(0, 16)}...</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={onCloseSession} disabled={closeSession.isPending}>
            <StopCircle className="mr-2 h-4 w-4" />
            Close Session
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Scan Item
            </CardTitle>
            <CardDescription>Scan product barcode into the current container</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScanSubmit(onScanItem)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="productCode">Product Code / Barcode *</Label>
                <Input id="productCode" placeholder="Scan or type..." autoFocus {...registerScan('productCode')} />
                {scanErrors.productCode && <p className="text-sm text-destructive">{scanErrors.productCode.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input id="quantity" type="number" min={1} {...registerScan('quantity')} />
                {scanErrors.quantity && <p className="text-sm text-destructive">{scanErrors.quantity.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lpn">LPN (optional)</Label>
                <Input id="lpn" placeholder="Scan LPN barcode..." {...registerScan('lpn')} />
              </div>
              <Button type="submit" disabled={isScanSubmitting || scanItem.isPending}>
                <ScanLine className="mr-2 h-4 w-4" />
                Scan Item
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Seal Container
            </CardTitle>
            <CardDescription>Seal a container when it's full</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContainerSubmit(onSealContainer)} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="containerId">Container ID *</Label>
                <Input id="containerId" placeholder="Scan container barcode..." {...registerContainer('containerId')} />
                {containerErrors.containerId && <p className="text-sm text-destructive">{containerErrors.containerId.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">
                  <Scale className="mr-1 inline h-3 w-3" /> Weight (kg, optional)
                </Label>
                <Input id="weight" type="number" step="0.1" placeholder="0.0" {...registerContainer('weight')} />
              </div>
              <Button type="submit" disabled={sealContainer.isPending}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Seal Container
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Containers ({containers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {containersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !containers || containers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No containers yet. Scan items to create one.</p>
          ) : (
            <div className="grid gap-2">
              {containers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Box className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{c.containerCode || c.id.substring(0, 12)}</p>
                      <p className="text-xs text-muted-foreground">{c.items || 0} items{c.weight ? ` | ${c.weight} kg` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === 'sealed' ? 'default' : 'secondary'}>
                      {c.status || 'open'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
