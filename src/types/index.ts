export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export type Theme = 'light' | 'dark' | 'system'

export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none'
export type SidebarVariant = 'inset' | 'sidebar' | 'floating'
