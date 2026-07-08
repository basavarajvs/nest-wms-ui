import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    if ('data' in data && Array.isArray((data as Record<string, unknown>).data)) {
      return (data as Record<string, unknown>).data as T[]
    }
    if ('items' in data && Array.isArray((data as Record<string, unknown>).items)) {
      return (data as Record<string, unknown>).items as T[]
    }
  }
  return []
}

export function safeTotal(data: unknown): number {
  if (data && typeof data === 'object') {
    if ('total' in data) return (data as Record<string, unknown>).total as number
    if ('meta' in data && typeof (data as Record<string, unknown>).meta === 'object') {
      const meta = (data as Record<string, unknown>).meta as Record<string, unknown>
      if ('total' in meta) return meta.total as number
    }
  }
  return 0
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
