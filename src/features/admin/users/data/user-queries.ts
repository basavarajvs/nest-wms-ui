import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UserController_findAll,
  UserController_invite,
  UserController_assignRole,
} from '@/lib/api/wms-saas-core-api/users/users'
import { RoleController_findAll } from '@/lib/api/wms-saas-core-api/roles/roles'
import type { InviteUserDto, AssignRoleDto } from '@/lib/types/wms-saas-core-api'
import type { UserControllerFindAllParams } from '@/lib/types/wms-saas-core-api/userControllerFindAllParams'

// Defensive helpers (generated responses are data: void)
function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.users)) return obj.users as T[]
  }
  return []
}

function safeTotal(data: unknown, fallback = 0): number {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.total === 'number') return obj.total
    if (typeof obj.count === 'number') return obj.count
    const arr = safeArray(obj)
    if (arr.length) return arr.length
  }
  return fallback
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  status?: string
  roles?: Array<{ id: string; code?: string; name?: string }>
  createdAt?: string
}

export interface Role {
  id: string
  code?: string
  name?: string
  description?: string
}

export function useUsers(params?: UserControllerFindAllParams) {
  return useQuery({
    queryKey: ['saas', 'users', 'list', params],
    queryFn: async () => {
      const res = await UserController_findAll(params)
      return res as unknown
    },
    select: (data) => ({
      users: safeArray<User>(data),
      total: safeTotal(data, safeArray<User>(data).length),
    }),
    staleTime: 1000 * 60 * 1,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: ['saas', 'roles', 'list'],
    queryFn: async () => {
      const res = await RoleController_findAll()
      return res as unknown
    },
    select: (data) => safeArray<Role>(data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: InviteUserDto) => {
      const res = await UserController_invite(dto)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas', 'users'] })
    },
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, dto }: { userId: string; dto: AssignRoleDto }) => {
      const res = await UserController_assignRole(userId, dto)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas', 'users'] })
    },
  })
}
