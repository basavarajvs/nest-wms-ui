import { create } from 'zustand'

export interface UserInfo {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  tenantId: string
  tenantCode: string
  tenantName: string
  roles: string[]
  permissions: string[]
}

interface AuthState {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null

  setUser: (user: UserInfo) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (user: UserInfo, accessToken: string, refreshToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,

  setUser: (user) => set({ user }),

  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('tenant_code', user.tenantCode)
    localStorage.setItem('user_info', JSON.stringify(user))
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('tenant_code')
    localStorage.removeItem('facility_code')
    localStorage.removeItem('user_info')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
