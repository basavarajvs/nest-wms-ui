import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { StepperDialog } from '@/components/wizard/StepperDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFacilities, useGenerateLocations } from '@/features/warehouse/data/warehouse-queries'
import type { GenerateLocationsDto } from '@/lib/types/wms-api/generateLocationsDto'
import type { Step } from '@/components/wizard/types'

const STEPS: Step[] = [
  { id: 'welcome', title: 'Welcome', description: 'Select facility and review the setup process' },
  { id: 'zones', title: 'Zones', description: 'Define zone names and codes' },
  { id: 'aisles', title: 'Aisles', description: 'Set aisle count per zone' },
  { id: 'bays', title: 'Bays', description: 'Set bay count per aisle' },
  { id: 'levels', title: 'Levels', description: 'Set level count per bay' },
  { id: 'locations', title: 'Locations', description: 'Set locations per level and naming pattern' },
  { id: 'review', title: 'Review & Generate', description: 'Review configuration and generate locations' },
]

const DEFAULT_ZONE_TEMPLATES = [
  { code: 'RCV', name: 'Receiving' },
  { code: 'BULK', name: 'Bulk Storage' },
  { code: 'FPK', name: 'Forward Pick' },
  { code: 'QC', name: 'Quality' },
  { code: 'SHP', name: 'Shipping' },
]

export interface ZoneSetup {
  code: string
  name: string
  aisleCount: number
  bayCount: number
  levelCount: number
  locationsPerLevel: number
}

interface WarehouseSetupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, '0')
}

function expandToDto(_facilityId: string, zones: ZoneSetup[]): GenerateLocationsDto {
  return {
    zones: zones.map((z) => ({
      code: z.code,
      name: z.name,
      aisleCount: z.aisleCount,
      aisles: Array.from({ length: z.aisleCount }, (_, ai) => {
        const aisleCode = `A${pad(ai + 1)}`
        return {
          code: aisleCode,
          bayCount: z.bayCount,
          bays: Array.from({ length: z.bayCount }, (_, bi) => {
            const bayCode = `B${pad(bi + 1)}`
            return {
              code: bayCode,
              levelCount: z.levelCount,
              levels: Array.from({ length: z.levelCount }, (_, li) => {
                const levelCode = `L${pad(li + 1)}`
                return {
                  code: levelCode,
                  locationPrefix: `${z.code}-${aisleCode}-${bayCode}-${levelCode}`,
                  locationsPerLevel: z.locationsPerLevel,
                }
              }),
            }
          }),
        }
      }),
    })),
  }
}

function calcTotalLocations(zones: ZoneSetup[]): number {
  return zones.reduce((sum, z) => sum + z.aisleCount * z.bayCount * z.levelCount * z.locationsPerLevel, 0)
}

export function WarehouseSetupWizard({ open, onOpenChange }: WarehouseSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { data: facilitiesData, isLoading: facilitiesLoading } = useFacilities()
  const generateLocations = useGenerateLocations()

  const facilities = facilitiesData?.facilities ?? []

  const [facilityId, setFacilityId] = useState('')
  const [zones, setZones] = useState<ZoneSetup[]>(() =>
    DEFAULT_ZONE_TEMPLATES.map((t) => ({
      code: t.code,
      name: t.name,
      aisleCount: 2,
      bayCount: 3,
      levelCount: 2,
      locationsPerLevel: 4,
    }))
  )

  const resetAll = useCallback(() => {
    setCurrentStep(0)
    setFacilityId('')
    setZones(DEFAULT_ZONE_TEMPLATES.map((t) => ({
      code: t.code,
      name: t.name,
      aisleCount: 2,
      bayCount: 3,
      levelCount: 2,
      locationsPerLevel: 4,
    })))
  }, [])

  const handleClose = useCallback(() => {
    resetAll()
    onOpenChange(false)
  }, [onOpenChange, resetAll])

  const updateZone = useCallback((index: number, field: keyof ZoneSetup, value: string | number) => {
    setZones((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }, [])

  const addZone = useCallback(() => {
    setZones((prev) => [...prev, { code: '', name: '', aisleCount: 1, bayCount: 1, levelCount: 1, locationsPerLevel: 1 }])
  }, [])

  const removeZone = useCallback((index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleBeforeNext = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      switch (stepIndex) {
        case 0: {
          if (!facilityId) {
            toast.error('Please select a facility to continue.')
            return false
          }
          return true
        }
        case 1: {
          if (zones.length === 0) {
            toast.error('Please define at least one zone.')
            return false
          }
          const invalid = zones.find((z) => !z.code.trim() || !z.name.trim())
          if (invalid) {
            toast.error('Each zone must have a code and name.')
            return false
          }
          const dupCode = zones.find((z, i) => zones.some((z2, j) => i !== j && z.code === z2.code))
          if (dupCode) {
            toast.error(`Duplicate zone code: ${dupCode.code}. Zone codes must be unique.`)
            return false
          }
          return true
        }
        case 2: {
          const invalid = zones.find((z) => z.aisleCount < 1)
          if (invalid) {
            toast.error('Each zone must have at least 1 aisle.')
            return false
          }
          return true
        }
        case 3: {
          const invalid = zones.find((z) => z.bayCount < 1)
          if (invalid) {
            toast.error('Each aisle must have at least 1 bay.')
            return false
          }
          return true
        }
        case 4: {
          const invalid = zones.find((z) => z.levelCount < 1)
          if (invalid) {
            toast.error('Each bay must have at least 1 level.')
            return false
          }
          return true
        }
        case 5: {
          const invalid = zones.find((z) => z.locationsPerLevel < 1)
          if (invalid) {
            toast.error('Each level must have at least 1 location.')
            return false
          }
          return true
        }
        default:
          return true
      }
    },
    [facilityId, zones]
  )

  const handleComplete = useCallback(async () => {
    try {
      const dto = expandToDto(facilityId, zones)
      await generateLocations.mutateAsync({ facilityId, dto })
      const total = calcTotalLocations(zones)
      toast.success(`Successfully generated ${total} locations across ${zones.length} zones.`)
      handleClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to generate locations')
    }
  }, [facilityId, zones, generateLocations, handleClose])

  const totalLocations = useMemo(() => calcTotalLocations(zones), [zones])

  return (
    <StepperDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose()
        else onOpenChange(val)
      }}
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={(step) => setCurrentStep(step as number)}
      onComplete={handleComplete}
      onCancel={handleClose}
      onBeforeNext={handleBeforeNext}
      title='Warehouse Setup Wizard'
    >
      {/* Step 0: Welcome */}
      {currentStep === 0 && (
        <div className='space-y-6 py-2'>
          <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2'>
            <p>This wizard will guide you through setting up a warehouse facility's location hierarchy.</p>
            <p>You will define:</p>
            <ul className='list-disc pl-5 space-y-1'>
              <li>Warehouse zones (Receiving, Bulk Storage, Forward Pick, Quality, Shipping)</li>
              <li>Aisles, bays, and levels per zone</li>
              <li>Locations per level with auto-generated naming</li>
            </ul>
            <p className='font-medium text-foreground'>
              Total locations to create: <span className='text-primary'>{totalLocations}</span>
            </p>
          </div>
          <div className='space-y-2'>
            <Label>Select Facility *</Label>
            {facilitiesLoading ? (
              <Skeleton className='h-10 w-full' />
            ) : (
              <Select value={facilityId} onValueChange={setFacilityId}>
                <SelectTrigger>
                  <SelectValue placeholder='Choose a facility...' />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.facilityName} ({f.facilityCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Zones */}
      {currentStep === 1 && (
        <div className='space-y-4 py-2'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[120px]'>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className='w-[60px]' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input
                        value={z.code}
                        onChange={(e) => updateZone(i, 'code', e.target.value.toUpperCase())}
                        placeholder='e.g. RCV'
                        maxLength={10}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={z.name}
                        onChange={(e) => updateZone(i, 'name', e.target.value)}
                        placeholder='e.g. Receiving'
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm' onClick={() => removeZone(i)} disabled={zones.length <= 1}>
                        ✕
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant='outline' size='sm' onClick={addZone}>
            + Add Zone
          </Button>
        </div>
      )}

      {/* Step 2: Aisles */}
      {currentStep === 2 && (
        <div className='space-y-4 py-2'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className='w-[140px]'>Aisle Count</TableHead>
                  <TableHead className='w-[200px]'>Naming Pattern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z, i) => (
                  <TableRow key={i}>
                    <TableCell className='font-medium'>{z.code} - {z.name}</TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        min={1}
                        max={50}
                        value={z.aisleCount}
                        onChange={(e) => updateZone(i, 'aisleCount', parseInt(e.target.value) || 1)}
                      />
                    </TableCell>
                    <TableCell className='font-mono text-xs text-muted-foreground'>
                      A01, A02, ... A{pad(Math.max(z.aisleCount, 1))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 3: Bays */}
      {currentStep === 3 && (
        <div className='space-y-4 py-2'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className='w-[140px]'>Bays per Aisle</TableHead>
                  <TableHead className='w-[200px]'>Naming Pattern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z, i) => (
                  <TableRow key={i}>
                    <TableCell className='font-medium'>{z.code} - {z.name}</TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        min={1}
                        max={50}
                        value={z.bayCount}
                        onChange={(e) => updateZone(i, 'bayCount', parseInt(e.target.value) || 1)}
                      />
                    </TableCell>
                    <TableCell className='font-mono text-xs text-muted-foreground'>
                      B01, B02, ... B{pad(Math.max(z.bayCount, 1))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 4: Levels */}
      {currentStep === 4 && (
        <div className='space-y-4 py-2'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className='w-[140px]'>Levels per Bay</TableHead>
                  <TableHead className='w-[200px]'>Naming Pattern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z, i) => (
                  <TableRow key={i}>
                    <TableCell className='font-medium'>{z.code} - {z.name}</TableCell>
                    <TableCell>
                      <Input
                        type='number'
                        min={1}
                        max={20}
                        value={z.levelCount}
                        onChange={(e) => updateZone(i, 'levelCount', parseInt(e.target.value) || 1)}
                      />
                    </TableCell>
                    <TableCell className='font-mono text-xs text-muted-foreground'>
                      L01, L02, ... L{pad(Math.max(z.levelCount, 1))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 5: Locations */}
      {currentStep === 5 && (
        <div className='space-y-4 py-2'>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead className='w-[140px]'>Locations per Level</TableHead>
                  <TableHead className='w-[220px]'>Code Pattern</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z, i) => {
                  const sample = `${z.code}-A01-B01-L01-001`
                  return (
                    <TableRow key={i}>
                      <TableCell className='font-medium'>{z.code} - {z.name}</TableCell>
                      <TableCell>
                        <Input
                          type='number'
                          min={1}
                          max={100}
                          value={z.locationsPerLevel}
                          onChange={(e) => updateZone(i, 'locationsPerLevel', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell className='font-mono text-xs text-muted-foreground'>
                        e.g. {sample}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <p className='text-xs text-muted-foreground'>
            Location codes follow the pattern: <span className='font-mono'>ZONE-AISLE-BAY-LEVEL-NNN</span>
          </p>
        </div>
      )}

      {/* Step 6: Review */}
      {currentStep === 6 && (
        <div className='space-y-4 py-2 max-h-[400px] overflow-y-auto'>
          <div className='rounded-lg border bg-muted/20 p-3'>
            <p className='text-sm font-medium'>Facility</p>
            <p className='text-sm text-muted-foreground'>
              {facilities.find((f) => f.id === facilityId)?.facilityName || facilityId}
            </p>
          </div>

          {zones.map((z) => {
            const zoneTotal = z.aisleCount * z.bayCount * z.levelCount * z.locationsPerLevel
            return (
              <div key={z.code} className='rounded-lg border p-3 space-y-1'>
                <p className='text-sm font-medium'>{z.code} - {z.name}</p>
                <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span>Aisles: {z.aisleCount}</span>
                  <span>Bays per aisle: {z.bayCount}</span>
                  <span>Levels per bay: {z.levelCount}</span>
                  <span>Locations per level: {z.locationsPerLevel}</span>
                  <span className='col-span-2 font-medium text-foreground'>
                    Total locations: {zoneTotal}
                  </span>
                </div>
              </div>
            )
          })}

          <div className='rounded-lg border border-primary/30 bg-primary/5 p-3'>
            <p className='text-sm font-semibold'>
              Grand Total: {totalLocations.toLocaleString()} locations across {zones.length} zones
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              Click Submit to generate all locations. This may take a moment.
            </p>
          </div>
        </div>
      )}
    </StepperDialog>
  )
}
