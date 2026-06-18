import { useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus, Search, MoreHorizontal, Shield, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  useUsers,
  useRoles,
  useInviteUser,
  useAssignRole,
  type User,
} from './data/user-queries'

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  roleId: z.string().optional(),
  message: z.string().optional(),
})

type InviteForm = z.infer<typeof inviteSchema>

export function AdminUsers() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('__all__')

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteResult, setInviteResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(
    null
  )

  const params = {
    page,
    limit,
    search: search || undefined,
    roleCode: roleFilter === '__all__' ? undefined : roleFilter,
  }

  const { data, isLoading, error, refetch } = useUsers(params)
  const { data: roles = [], isLoading: rolesLoading } = useRoles()

  const inviteMutation = useInviteUser()
  const assignRoleMutation = useAssignRole()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      roleId: '__none__',
      message: '',
    },
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Invite handler
  const onInviteSubmit = async (values: InviteForm) => {
    try {
      const res = await inviteMutation.mutateAsync({
        email: values.email,
        message: values.message,
        roleId: values.roleId === '__none__' ? undefined : values.roleId,
      } as any)
      const token = (res as any)?.data?.token
      if (token) {
        const url = `${window.location.origin}/accept-invite?token=${token}`
        setInviteResult(url)
        toast.success('Invitation sent', {
          description: url,
          duration: 10000,
        })
      } else {
        toast.success('Invitation sent successfully')
        setInviteOpen(false)
        reset()
        refetch()
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send invitation'
      toast.error(msg)
    }
  }

  // Role assignment
  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignRoleMutation.mutateAsync({
        userId,
        dto: { roleId } as any,
      })
      toast.success('Role assigned')
      setSelectedUserForRole(null)
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to assign role'
      toast.error(msg)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>User Management</h1>
          <p className='text-muted-foreground'>
            Manage tenant users, send invitations, and assign roles
          </p>
        </div>

        <Dialog
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open)
            if (!open) {
              setInviteResult(null)
              reset()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className='mr-2 h-4 w-4' />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[560px]'>
            {inviteResult ? (
              <>
                <DialogHeader>
                  <DialogTitle>Invitation Sent</DialogTitle>
                  <DialogDescription>
                    Share this link with the user to complete registration.
                  </DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                  <Label className='mb-2 block text-sm font-medium'>
                    Invitation Link
                  </Label>
                  <div className='flex items-center gap-2'>
                    <code className='flex-1 break-all rounded-md border bg-muted px-3 py-2 text-sm'>
                      {inviteResult}
                    </code>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={async () => {
                        await navigator.clipboard.writeText(inviteResult)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                    >
                      {copied ? (
                        <Check className='h-4 w-4 text-green-500' />
                      ) : (
                        <Copy className='h-4 w-4' />
                      )}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setInviteOpen(false)
                      setInviteResult(null)
                      reset()
                      refetch()
                    }}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <form onSubmit={handleSubmit(onInviteSubmit)}>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                  <DialogDescription>
                    Send an invitation email. The user will receive a link to
                    complete registration.
                  </DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='email'>Email *</Label>
                    <Input id='email' type='email' {...register('email')} />
                    {errors.email && (
                      <p className='text-sm text-destructive'>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <Label htmlFor='firstName'>First Name *</Label>
                      <Input id='firstName' {...register('firstName')} />
                      {errors.firstName && (
                        <p className='text-sm text-destructive'>
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor='lastName'>Last Name *</Label>
                      <Input id='lastName' {...register('lastName')} />
                      {errors.lastName && (
                        <p className='text-sm text-destructive'>
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    <Label>Assign Role (optional)</Label>
                    <Select
                      onValueChange={(val) => setValue('roleId', val)}
                      value={watch('roleId')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select a role' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='__none__'>No role</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.roleId} value={role.roleId}>
                            {role.roleName || role.roleCode || role.roleId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='message'>Custom Message (optional)</Label>
                    <Input
                      id='message'
                      {...register('message')}
                      placeholder='Welcome to the team!'
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setInviteOpen(false)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting || inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search className='absolute top-3 left-3 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by email or name...'
            className='pl-9'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <Select
          value={roleFilter}
          onValueChange={(val) => {
            setRoleFilter(val)
            setPage(1)
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by role' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__all__'>All Roles</SelectItem>
            {roles.map((r) => (
              <SelectItem key={r.roleId} value={r.roleCode || r.roleId}>
                {r.roleName || r.roleCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant='outline' onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            {total} user{total !== 1 ? 's' : ''} in this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-destructive font-medium">Failed to load users</p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || 'An unexpected error occurred'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : users.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground'>
              No users found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.status === 'pending'
                          ? '—'
                          : [user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(' ') || '—'}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-wrap gap-1'>
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role, idx) => (
                              <Badge key={idx} variant='secondary'>
                                {role.roleName || role.roleCode || 'Role'}
                              </Badge>
                            ))
                          ) : (
                            <span className='text-sm text-muted-foreground'>
                              No roles
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active'
                              ? 'default'
                              : user.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            user.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100'
                              : ''
                          }
                        >
                          {user.status === 'pending'
                            ? 'Invited'
                            : user.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {user.status === 'pending' ? (
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (!user.invitationToken) return
                                  const url = `${window.location.origin}/accept-invite?token=${user.invitationToken}`
                                  await navigator.clipboard.writeText(url)
                                  toast.success('Invitation link copied')
                                }}
                              >
                                <Copy className='mr-2 h-4 w-4' />
                                Copy Invitation Link
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setSelectedUserForRole(user)}
                              >
                                <Shield className='mr-2 h-4 w-4' />
                                Assign Role
                              </DropdownMenuItem>
                            )}
                            {/* Future: Deactivate, etc. */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Simple Pagination */}
              <div className='mt-4 flex items-center justify-between text-sm'>
                <div>
                  Page {page} of {totalPages}
                </div>
                <div className='flex gap-2'>
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
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog
        open={!!selectedUserForRole}
        onOpenChange={(open) => !open && setSelectedUserForRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Role to {selectedUserForRole?.email}
            </DialogTitle>
            <DialogDescription>
              Select a role to assign. This will add the role to the user.
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            {rolesLoading ? (
              <Skeleton className='h-10 w-full' />
            ) : (
              <Select
                onValueChange={(roleId) => {
                  if (selectedUserForRole) {
                    handleAssignRole(selectedUserForRole.id, roleId)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Choose a role' />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.roleId} value={role.roleId}>
                      {role.roleName || role.roleCode || role.roleId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSelectedUserForRole(null)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
