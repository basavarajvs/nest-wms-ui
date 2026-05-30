import { Building2, Check, ChevronsUpDown, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useFacility } from '@/hooks/useFacility'
import { useState } from 'react'

export function FacilitySelector() {
  const { selectedFacility, setSelectedFacility, facilities, isLoading, error } =
    useFacility()
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-40" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 border-b px-4 py-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs">Failed to load facilities</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2 border-b px-4 py-1.5">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-normal"
          >
            {selectedFacility ? (
              <>
                <span className="font-medium">{selectedFacility.facilityCode}</span>
                <span className="text-muted-foreground hidden sm:inline">
                  — {selectedFacility.facilityName}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select facility</span>
            )}
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search facility..." />
            <CommandList>
              <CommandEmpty>No facilities found.</CommandEmpty>
              <CommandGroup>
                {facilities.map((f) => (
                  <CommandItem
                    key={f.id}
                    value={`${f.facilityCode} ${f.facilityName}`}
                    onSelect={() => {
                      setSelectedFacility(f)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedFacility?.id === f.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {f.facilityCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {f.facilityName}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
