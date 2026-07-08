import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth-store'

const mockUser = {
  id: 'user-1',
  username: 'jdoe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  tenantId: 'tenant-1',
  tenantCode: 'ACME',
  tenantName: 'Acme Corp',
  roles: ['WAREHOUSE_ADMIN'],
  permissions: ['read:products', 'write:products'],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,
      refreshToken: null,
    })
  })

  it('starts with initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(true)
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('setUser updates the user', () => {
    useAuthStore.getState().setUser(mockUser)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
  })

  it('setTokens updates access and refresh tokens', () => {
    useAuthStore.getState().setTokens('access-123', 'refresh-456')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access-123')
    expect(state.refreshToken).toBe('refresh-456')
  })

  it('login sets full auth state and persists to localStorage', () => {
    useAuthStore.getState().login(mockUser, 'access-token', 'refresh-token')

    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
    expect(state.accessToken).toBe('access-token')
    expect(state.refreshToken).toBe('refresh-token')

    expect(localStorage.getItem('auth_token')).toBe('access-token')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-token')
    expect(localStorage.getItem('tenant_code')).toBe('ACME')
    expect(localStorage.getItem('user_info')).toBe(JSON.stringify(mockUser))
  })

  it('logout clears all auth state and localStorage items', () => {
    localStorage.setItem('auth_token', 'some-token')
    localStorage.setItem('refresh_token', 'some-refresh')
    localStorage.setItem('tenant_code', 'TENANT')
    localStorage.setItem('facility_code', 'FAC-001')
    localStorage.setItem('user_info', JSON.stringify(mockUser))

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(false)
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('tenant_code')).toBeNull()
    expect(localStorage.getItem('facility_code')).toBeNull()
    expect(localStorage.getItem('user_info')).toBeNull()
  })

  it('setLoading updates loading state', () => {
    useAuthStore.getState().setLoading(false)
    expect(useAuthStore.getState().isLoading).toBe(false)

    useAuthStore.getState().setLoading(true)
    expect(useAuthStore.getState().isLoading).toBe(true)
  })

  it('login sets isAuthenticated to true', () => {
    useAuthStore.getState().login(mockUser, 'token', 'refresh')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('login sets isLoading to false', () => {
    useAuthStore.getState().login(mockUser, 'token', 'refresh')
    expect(useAuthStore.getState().isLoading).toBe(false)
  })
})
