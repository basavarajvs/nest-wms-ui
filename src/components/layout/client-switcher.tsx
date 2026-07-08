import { useEffect } from 'react'
import { CheckIcon, ChevronsUpDownIcon, UsersIcon } from 'lucide-react'
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
import { useClientStore } from '@/stores/client-store'
import { useClientsForLookup } from '@/features/asns/data/asn-queries'
import { cn } from '@/lib/utils'

export function ClientSwitcher() {
  const { selectedClient, setClients, selectClient } = useClientStore()
  const { data: clients = [], isLoading } = useClientsForLookup()

  useEffect(() => {
    if (clients.length > 0) {
      setClients(clients)
    }
  }, [clients, setClients])

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-muted-foreground"
        disabled
      >
        <UsersIcon className="size-4 animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    )
  }

  if (clients.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-muted-foreground"
        disabled
      >
        <UsersIcon className="size-4" />
        <span className="hidden sm:inline">No clients</span>
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
          <UsersIcon className="size-4 shrink-0" />
          <span className="hidden max-w-[140px] truncate sm:inline">
            {selectedClient?.name || 'Select Client'}
          </span>
          <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.code}
                  onSelect={() => selectClient(client)}
                >
                  <UsersIcon className="mr-2 size-4 shrink-0" />
                  <span className="truncate">{client.name}</span>
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4 shrink-0',
                      selectedClient?.id === client.id
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
