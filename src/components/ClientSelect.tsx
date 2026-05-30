import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClients } from '@/features/clients/data/client-queries'

interface ClientSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onlyActive?: boolean
}

export function ClientSelect({
  value,
  onValueChange,
  placeholder = 'Select client',
  disabled = false,
  className,
  onlyActive = true,
}: ClientSelectProps) {
  const { data, isLoading } = useClients()
  const clients = data?.clients || []

  // Extract and filter clients
  const filteredClients = useMemo(() => {
    if (onlyActive) {
      return clients.filter((c) => c.isActive !== false)
    }
    return clients
  }, [clients, onlyActive])

  // Create searchable options combining client code and name
  const clientOptions = useMemo(() => {
    return filteredClients.map((client) => ({
      value: client.id?.toString() || '',
      label: `${client.clientCode || 'N/A'}${client.name ? ` - ${client.name}` : ''}`,
    }))
  }, [filteredClients])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'Loading clients...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clientOptions.length === 0 ? (
          <div className='px-2 py-6 text-center text-sm text-muted-foreground'>
            {isLoading ? 'Loading...' : 'No clients found'}
          </div>
        ) : (
          clientOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
