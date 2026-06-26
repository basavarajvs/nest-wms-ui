import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Search, Edit, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useProducts,
  useDeleteProduct,
  type Product,
} from '@/features/items/products/data/product-queries'

const VELOCITY_CLASSES = ['A', 'B', 'C', 'D']

export function ProductList() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [velocityClass, setVelocityClass] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const params = {
    page,
    limit,
    search: search || undefined,
    velocityClass: velocityClass || undefined,
    isActive:
      isActiveFilter === 'all'
        ? undefined
        : isActiveFilter === 'active'
          ? true
          : isActiveFilter === 'inactive'
            ? false
            : undefined,
  }

  const { data, isLoading, isError, error, refetch } = useProducts(params)
  const deleteMutation = useDeleteProduct()

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const handleDelete = useCallback(async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Product deleted successfully')
      setDeleteId(null)
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete product'
      toast.error(msg)
    }
  }, [deleteId, deleteMutation])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Products</h1>
          <p className='text-muted-foreground'>
            Manage master product catalog and configurations
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button onClick={() => navigate({ to: '/items/products/new' })}>
            <Plus className='mr-2 h-4 w-4' />
            New Product
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search by code or name...'
            className='pl-9'
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Select
          value={velocityClass}
          onValueChange={(v) => {
            setVelocityClass(v)
            setPage(1)
          }}
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Velocity' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Classes</SelectItem>
            {VELOCITY_CLASSES.map((vc) => (
              <SelectItem key={vc} value={vc}>
                Class {vc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={isActiveFilter}
          onValueChange={(v) => {
            setIsActiveFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='inactive'>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Product Master</CardTitle>
          <CardDescription>
            {total} product{total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='font-medium text-destructive'>
                Failed to load products
              </p>
              <p className='text-sm text-muted-foreground'>
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant='outline' size='sm' onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-8 text-center'>
              <p className='text-muted-foreground'>No products found</p>
              {search && (
                <p className='text-sm text-muted-foreground'>
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[120px]'>Code</TableHead>
                      <TableHead className='w-[200px]'>Name</TableHead>
                      <TableHead className='hidden w-[200px] md:table-cell'>
                        Description
                      </TableHead>
                      <TableHead className='hidden w-[130px] md:table-cell'>
                        Tracking
                      </TableHead>
                      <TableHead className='hidden w-[120px] sm:table-cell'>
                        Category
                      </TableHead>
                      <TableHead className='hidden w-[90px] sm:table-cell'>
                        Velocity
                      </TableHead>
                      <TableHead className='w-[100px]'>Status</TableHead>
                      <TableHead className='w-[100px] text-right'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className='font-medium'>
                          {product.productCode}
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className='hidden max-w-[200px] truncate text-muted-foreground md:table-cell'>
                          {product.description || '—'}
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex gap-1'>
                            {product.trackLot && (
                              <Badge variant='outline' className='text-xs'>
                                Lot
                              </Badge>
                            )}
                            {product.trackSerial && (
                              <Badge variant='outline' className='text-xs'>
                                Serial
                              </Badge>
                            )}
                            {product.trackExpiry && (
                              <Badge variant='outline' className='text-xs'>
                                Expiry
                              </Badge>
                            )}
                            {!product.trackLot &&
                              !product.trackSerial &&
                              !product.trackExpiry && (
                                <span className='text-xs text-muted-foreground'>
                                  None
                                </span>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          {product.categoryId ? (
                            <Badge variant='outline'>
                              {product.categoryId}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell className='hidden sm:table-cell'>
                          {product.velocityClass ? (
                            <Badge variant='secondary'>
                              {product.velocityClass}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground'>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.isActive !== false
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {product.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex items-center justify-end gap-1'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() =>
                                navigate({
                                  to: `/items/products/${product.id}/edit`,
                                })
                              }
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setDeleteId(product.id)}
                            >
                              <Trash2 className='h-4 w-4 text-destructive' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='flex items-center justify-between pt-4'>
                <p className='text-sm text-muted-foreground'>
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently
              removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
