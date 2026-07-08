import { useEffect, useRef } from 'react'
import { CheckIcon, ChevronsUpDownIcon, Building2Icon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFacilityStore } from '@/stores/facility-store'
import { cn } from '@/lib/utils'
import { FacilityController_getSummary } from '@/lib/wms-api/api/wms-api/warehouse-facilities/warehouse-facilities'

interface FacilitySummaryResponse {
  success: boolean
  data: {
    total: number
    facilities: Array<{
      facilityId: string
      facilityCode: string
      facilityName: string
      zoneCount: number
      locationCount: number
    }>
  }
}

export function FacilitySwitcher() {
  const { selectedFacility, facilities, setFacilities, selectFacility, isLoading, setLoading } =
    useFacilityStore()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current || facilities.length > 0) return
    fetchedRef.current = true

    const storedCode = localStorage.getItem('facility_code')
    const storedId = localStorage.getItem('facility_id')
    const storedName = localStorage.getItem('facility_name')

    setLoading(true)
    FacilityController_getSummary()
      .then((response) => {
        const envelope = response as unknown as FacilitySummaryResponse
        const raw = envelope.data?.facilities
        if (raw && raw.length > 0) {
          const items = raw.map((f) => ({
            id: f.facilityId,
            code: f.facilityCode,
            name: f.facilityName,
          }))
          setFacilities(items)
          const matched = storedCode
            ? items.find((f) => f.code === storedCode)
            : null
          if (matched) {
            selectFacility(matched)
          }
        } else if (storedId && storedCode && storedName) {
          setFacilities([{ id: storedId, code: storedCode, name: storedName }])
        }
      })
      .catch(() => {
        if (storedId && storedCode && storedName) {
          setFacilities([{ id: storedId, code: storedCode, name: storedName }])
        }
      })
      .finally(() => setLoading(false))
  }, [facilities.length, setFacilities, selectFacility, setLoading])

  useEffect(() => {
    if (!selectedFacility && facilities.length > 0) {
      selectFacility(facilities[0])
    }
  }, [selectedFacility, facilities, selectFacility])

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-muted-foreground"
        disabled
      >
        <Loader2Icon className="size-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  if (facilities.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-muted-foreground"
        disabled
      >
        <Building2Icon className="size-4" />
        <span className="hidden sm:inline">No facilities</span>
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          role="combobox"
          className="h-8 gap-1.5 px-2 text-muted-foreground"
        >
          <Building2Icon className="size-4 shrink-0" />
          <span className="hidden max-w-[140px] truncate sm:inline">
            {selectedFacility?.name || 'Select Facility'}
          </span>
          <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search facilities..." />
          <CommandList>
            <CommandEmpty>No facilities found.</CommandEmpty>
            <CommandGroup>
              {facilities.map((facility) => (
                <CommandItem
                  key={facility.id}
                  value={facility.code}
                  onSelect={() => selectFacility(facility)}
                >
                  <Building2Icon className="mr-2 size-4 shrink-0" />
                  <span className="truncate">{facility.name}</span>
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      selectedFacility?.id === facility.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
