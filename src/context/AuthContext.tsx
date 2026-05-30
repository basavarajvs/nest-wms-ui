import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  AuthController_login,
  AuthController_logout,
  AuthController_refresh,
} from '@/lib/api/wms-saas-core-api/auth/auth'
import { UserController_getMe } from '@/lib/api/wms-saas-core-api/users/users'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  tenantCode?: string
  roles?: string[]
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: {
    email: string
    password: string
    tenantCode?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchUserProfile(): Promise<User> {
  const response = (await UserController_getMe()) as unknown as User
  const userData = (response as any)?.data ?? response
  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    tenantCode:
      userData.tenantCode || localStorage.getItem('tenant_code') || undefined,
    roles: userData.roles ?? [],
  }
}

function clearAuthState() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('tenant_code')
  localStorage.removeItem('user_info')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      fetchUserProfile()
        .then((profile) => {
          setUser(profile)
        })
        .catch(() => {
          clearAuthState()
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(
    async (credentials: {
      email: string
      password: string
      tenantCode?: string
    }) => {
      try {
        if (credentials.tenantCode) {
          localStorage.setItem('tenant_code', credentials.tenantCode)
        }

        const loginResponse = (await AuthController_login({
          email: credentials.email,
          password: credentials.password,
        })) as any
        const tokens = loginResponse?.data ?? loginResponse

        localStorage.setItem('auth_token', tokens.accessToken)
        localStorage.setItem('refresh_token', tokens.refreshToken)

        const userProfile = await fetchUserProfile()
        setUser(userProfile)
        localStorage.setItem('user_info', JSON.stringify(userProfile))

        return { success: true }
      } catch (error: any) {
        clearAuthState()
        setUser(null)

        const message =
          error?.response?.data?.message || error?.message || 'Login failed'
        return { success: false, error: message }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh_token')
      if (storedRefreshToken) {
        await AuthController_logout({ refreshToken: storedRefreshToken })
      }
    } catch {
    } finally {
      clearAuthState()
      setUser(null)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token')
    if (!storedRefreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const refreshResponse = (await AuthController_refresh({
        refreshToken: storedRefreshToken,
      })) as any
      const tokens = refreshResponse?.data ?? refreshResponse

      localStorage.setItem('auth_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
    } catch {
      clearAuthState()
      setUser(null)
      throw new Error('Failed to refresh token')
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
