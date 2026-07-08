import { createContext, useContext, useEffect, useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  AuthController_login,
  AuthController_refresh,
  AuthController_logout,
} from '@/lib/saas-core-api/api/wms-saas-core-api/auth/auth'
import type { LoginDto, RefreshTokenDto } from '@/lib/saas-core-api/types/wms-saas-core-api'
import { useAuthStore, type UserInfo } from '@/stores/auth-store'

export interface AuthContextValue {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tenantCode: string, credential: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
  } = useAuthStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userInfo = localStorage.getItem('user_info')

    if (token && userInfo) {
      try {
        const parsed = JSON.parse(userInfo) as UserInfo
        useAuthStore.setState({
          user: parsed,
          isAuthenticated: true,
          isLoading: false,
          accessToken: token,
          refreshToken: localStorage.getItem('refresh_token'),
        })
      } catch {
        storeLogout()
      }
    } else {
      setLoading(false)
    }
    setInitialized(true)
  }, [storeLogout, setLoading])

  const login = useCallback(
    async (tenantCode: string, credential: string, password: string) => {
      try {
        const loginDto: LoginDto = {
          password,
          ...(credential.includes('@') ? { email: credential } : { username: credential }),
        }
        const response = await AuthController_login(
          loginDto,
          { headers: { 'X-Tenant-Code': tenantCode } } as RequestInit,
        )
        const payload = (response as unknown as { data: Record<string, unknown> }).data as {
          accessToken: string
          refreshToken: string
          user: Record<string, unknown>
        }

        const { accessToken, refreshToken, user: userData } = payload

        const userInfo: UserInfo = {
          id: (userData?.id as string) || '',
          username: (userData?.username as string) || credential,
          email: (userData?.email as string) || credential,
          firstName: (userData?.firstName as string) || '',
          lastName: (userData?.lastName as string) || '',
          tenantId: (userData?.tenantId as string) || tenantCode,
          tenantCode: (userData?.tenantCode as string) || tenantCode,
          tenantName: (userData?.tenantName as string) || '',
          roles: (userData?.roles as string[]) || [],
          permissions: (userData?.permissions as string[]) || [],
        }

        storeLogin(userInfo, accessToken, refreshToken)
      } catch (error) {
        throw error
      }
    },
    [storeLogin]
  )

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        await AuthController_logout({ refreshToken } as RefreshTokenDto)
      }
    } catch {
      // ignore logout API errors
    }
    storeLogout()
  }, [storeLogout])

  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem('refresh_token')
    if (!storedRefreshToken) return false

    try {
      const response = await AuthController_refresh(
        { refreshToken: storedRefreshToken } as RefreshTokenDto,
      )
      const payload = (response as unknown as { data: Record<string, unknown> }).data as {
        accessToken: string
        refreshToken?: string
      }
      if (payload.accessToken) {
        localStorage.setItem('auth_token', payload.accessToken)
        if (payload.refreshToken) {
          localStorage.setItem('refresh_token', payload.refreshToken)
        }
        return true
      }
      return false
    } catch {
      storeLogout()
      return false
    }
  }, [storeLogout])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshToken: refreshTokenFn,
    }),
    [user, isAuthenticated, isLoading, login, logout, refreshTokenFn]
  )

  if (!initialized) {
    return null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
