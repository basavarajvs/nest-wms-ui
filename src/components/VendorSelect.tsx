import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVendors } from '@/features/vendors/data/vendor-queries'

interface VendorSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  onlyActive?: boolean
}

export function VendorSelect({
  value,
  onValueChange,
  placeholder = 'Select vendor',
  disabled = false,
  className,
  onlyActive = true,
}: VendorSelectProps) {
  const { data, isLoading } = useVendors()
  const vendors = data?.vendors || []

  // Extract and filter vendors
  const filteredVendors = useMemo(() => {
    if (onlyActive) {
      return vendors.filter((v) => v.isActive !== false)
    }
    return vendors
  }, [vendors, onlyActive])

  // Create options combining vendor code and name
  const vendorOptions = useMemo(() => {
    return filteredVendors.map((vendor) => ({
      value: vendor.id?.toString() || '',
      label: `${vendor.vendorCode || 'N/A'}${vendor.name ? ` - ${vendor.name}` : ''}`,
    }))
  }, [filteredVendors])

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'Loading vendors...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {vendorOptions.length === 0 ? (
          <div className='px-2 py-6 text-center text-sm text-muted-foreground'>
            {isLoading ? 'Loading...' : 'No vendors found'}
          </div>
        ) : (
          vendorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
