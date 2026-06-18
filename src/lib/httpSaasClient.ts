import Axios, { type AxiosRequestConfig, type AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_SAAS_API_BASE_URL || 'http://localhost:3000'

export const AXIOS_INSTANCE = Axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

function clearAuthState() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('tenant_code')
  localStorage.removeItem('user_info')
}

async function attemptTokenRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const response = await Axios.post(
    `${BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  )

  const body = response.data
  const tokens = body?.data ?? body
  localStorage.setItem('auth_token', tokens.accessToken)
  localStorage.setItem('refresh_token', tokens.refreshToken)
  return tokens.accessToken
}

AXIOS_INSTANCE.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const tenantCode = localStorage.getItem('tenant_code')
    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode
    }
    return config
  },
  (error) => Promise.reject(error),
)

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as Record<string, unknown>
      if (
        data.error &&
        typeof data.error === 'object' &&
        !data.message
      ) {
        const errObj = data.error as Record<string, unknown>
        if (typeof errObj.message === 'string') {
          data.message = errObj.message
        }
      }
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          }
          return AXIOS_INSTANCE(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await attemptTokenRefresh()
        processQueue(null, newToken)
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        }
        return AXIOS_INSTANCE(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAuthState()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export const customInstance = <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const config: AxiosRequestConfig = {
    url,
    method: (options?.method as AxiosRequestConfig['method']) ?? 'GET',
    headers: options?.headers as Record<string, string>,
    data: options?.body,
    signal: options?.signal as AbortSignal | undefined,
  }

  return AXIOS_INSTANCE(config).then(({ data }) => data)
}

export default customInstance
