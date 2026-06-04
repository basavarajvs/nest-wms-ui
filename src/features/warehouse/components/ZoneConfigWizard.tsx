import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ZoneSetup } from './WarehouseSetupWizard'

interface ZoneConfigWizardProps {
  zone: ZoneSetup
  index: number
  onChange: (index: number, field: keyof ZoneSetup, value: string | number) => void
}

export function ZoneConfigWizard({ zone, index, onChange }: ZoneConfigWizardProps) {
  return (
    <div className='rounded-lg border p-4 space-y-3'>
      <div className='text-sm font-medium text-muted-foreground'>
        Zone {index + 1}
      </div>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <div className='space-y-1'>
          <Label className='text-xs'>Code</Label>
          <Input
            value={zone.code}
            onChange={(e) => onChange(index, 'code', e.target.value.toUpperCase())}
            placeholder='e.g. RCV'
            maxLength={10}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Name</Label>
          <Input
            value={zone.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
            placeholder='e.g. Receiving'
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Aisles</Label>
          <Input
            type='number'
            min={1}
            max={50}
            value={zone.aisleCount}
            onChange={(e) => onChange(index, 'aisleCount', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Bays per Aisle</Label>
          <Input
            type='number'
            min={1}
            max={50}
            value={zone.bayCount}
            onChange={(e) => onChange(index, 'bayCount', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Levels per Bay</Label>
          <Input
            type='number'
            min={1}
            max={20}
            value={zone.levelCount}
            onChange={(e) => onChange(index, 'levelCount', parseInt(e.target.value) || 1)}
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-xs'>Locations per Level</Label>
          <Input
            type='number'
            min={1}
            max={100}
            value={zone.locationsPerLevel}
            onChange={(e) => onChange(index, 'locationsPerLevel', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <div className='text-xs text-muted-foreground'>
        Sample code: <span className='font-mono'>{zone.code || 'ZONE'}-A01-B01-L01-001</span>
      </div>
    </div>
  )
}
