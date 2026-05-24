import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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

import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type Product,
} from './data/product-queries'

// Simple validation schema (expand as needed)
const productSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trackLot: z.boolean().optional().default(false),
  trackSerial: z.boolean().optional().default(false),
  trackExpiry: z.boolean().optional().default(false),
  velocityClass: z.string().optional(),
  isActive: z.boolean().optional().default(true),
})

type ProductForm = z.infer<typeof productSchema>

export function Products() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const params = {
    page,
    limit,
    search: search || undefined,
  }

  const { data, isLoading, error, refetch } = useProducts(params)
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      productCode: '',
      name: '',
      description: '',
      trackLot: false,
      trackSerial: false,
      trackExpiry: false,
      velocityClass: '',
      isActive: true,
    },
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Open dialog for create or edit
  const openDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      reset({
        productCode: product.productCode,
        name: product.name,
        description: product.description || '',
        trackLot: !!product.trackLot,
        trackSerial: !!product.trackSerial,
        trackExpiry: !!product.trackExpiry,
        velocityClass: product.velocityClass || '',
        isActive: product.isActive !== false,
      })
    } else {
      setEditingProduct(null)
      reset({
        productCode: '',
        name: '',
        description: '',
        trackLot: false,
        trackSerial: false,
        trackExpiry: false,
        velocityClass: '',
        isActive: true,
      })
    }
    setDialogOpen(true)
  }

  const onSubmit = async (values: ProductForm) => {
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          dto: values as any,
        })
        toast.success('Product updated')
      } else {
        await createMutation.mutateAsync(values as any)
        toast.success('Product created')
      }
      setDialogOpen(false)
      setEditingProduct(null)
      reset()
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed'
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success('Product deleted')
      setDeleteId(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage master product data for the warehouse
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct ? 'Update the product details below.' : 'Add a new product to the master data.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="productCode">Product Code *</Label>
                  <Input id="productCode" {...register('productCode')} disabled={!!editingProduct} />
                  {errors.productCode && <p className="text-sm text-destructive">{errors.productCode.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" {...register('description')} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" {...register('trackLot')} id="trackLot" />
                    <Label htmlFor="trackLot">Track Lot</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" {...register('trackSerial')} id="trackSerial" />
                    <Label htmlFor="trackSerial">Track Serial</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" {...register('trackExpiry')} id="trackExpiry" />
                    <Label htmlFor="trackExpiry">Track Expiry</Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="velocityClass">Velocity Class</Label>
                  <Input id="velocityClass" {...register('velocityClass')} placeholder="A, B, C..." />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Master</CardTitle>
          <CardDescription>{total} products</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-destructive py-4">Failed to load products.</div>
          ) : products.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No products found.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.productCode}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 text-xs">
                          {product.trackLot && <Badge variant="outline">Lot</Badge>}
                          {product.trackSerial && <Badge variant="outline">Serial</Badge>}
                          {product.trackExpiry && <Badge variant="outline">Expiry</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive !== false ? 'default' : 'secondary'}>
                          {product.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex justify-between text-sm">
                <span>Page {page} of {totalPages}</span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
