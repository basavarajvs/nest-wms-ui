import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Loader2, Package } from 'lucide-react'
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
import { useProducts, type Product } from '@/features/items/products/data/product-queries'

interface ProductSearchSelectProps {
  value?: string // productCode
  onValueChange: (productCode: string, product: Product | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  clientId?: string // Optional client ID to filter products if client-assignment exists
}

export function ProductSearchSelect({
  value,
  onValueChange,
  placeholder = 'Select product...',
  disabled = false,
  className,
  clientId,
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch products with the search term
  const { data, isLoading } = useProducts({
    search: debouncedSearchQuery || undefined,
    isActive: true,
  })

  const products = data?.products || []

  // Keep track of the selected product separately for display
  const [selectedProductForDisplay, setSelectedProductForDisplay] = useState<Product | undefined>(undefined)

  // Update selected product when value changes
  useEffect(() => {
    if (value && products.length > 0) {
      const found = products.find((p) => p.productCode === value)
      if (found) {
        setSelectedProductForDisplay(found)
      }
    }
  }, [value, products])

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSearchQuery('')
        setDebouncedSearchQuery('')
      }
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedProductForDisplay ? (
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selectedProductForDisplay.productCode} - {selectedProductForDisplay.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {clientId ? `${placeholder} (filtered)` : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search products..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Searching products...
                </span>
              </div>
            ) : products.length === 0 ? (
              <CommandEmpty>
                {searchQuery.length > 0 ? 'No products found.' : 'Start typing to search products...'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {products.slice(0, 50).map((product) => (
                  <CommandItem
                    key={product.productCode}
                    value={product.productCode}
                    onSelect={() => {
                      onValueChange(product.productCode || '', product)
                      setSelectedProductForDisplay(product)
                      setOpen(false)
                      setSearchQuery('')
                      setDebouncedSearchQuery('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === product.productCode ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">
                          {product.productCode}
                        </span>
                      </div>
                      <span className="text-sm">{product.name}</span>
                      {product.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
                {products.length > 50 && (
                  <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    Showing first 50 results.
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
