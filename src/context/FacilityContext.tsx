import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  WarehouseFacilityController_findAllWeb,
} from '@/lib/api/wms-api/master-data/master-data'
import { useAuth } from '@/hooks/useAuth'

function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.facilities)) return obj.facilities as T[]
  }
  return []
}

export interface Facility {
  id: string
  facilityCode: string
  facilityName: string
  facilityType?: string
  isActive?: boolean
}

export interface FacilityContextType {
  selectedFacility: Facility | null
  setSelectedFacility: (facility: Facility | null) => void
  facilities: Facility[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export const FacilityContext = createContext<FacilityContextType | undefined>(
  undefined
)

const STORAGE_KEY = 'selected_facility'

export function FacilityProvider({ children }: { children: ReactNode }) {
  const [selectedFacility, setSelectedFacilityState] =
    useState<Facility | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { isAuthenticated } = useAuth()

  const loadFacilities = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      const res = await WarehouseFacilityController_findAllWeb()
      const list = safeArray<Record<string, unknown>>(res as unknown).map(
        (item): Facility => ({
          id: (item.id as string) ?? '',
          facilityCode: (item.facilityCode as string) ?? '',
          facilityName: (item.name as string) ?? (item.facilityName as string) ?? '',
          facilityType: item.facilityType as string | undefined,
          isActive: item.isActive as boolean | undefined,
        })
      )
      setFacilities(list)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load facilities'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadFacilities()
    } else {
      setIsLoading(false)
    }
  }, [loadFacilities, isAuthenticated])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Facility
        setSelectedFacilityState(parsed)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [facilities])

  const setSelectedFacility = useCallback((facility: Facility | null) => {
    setSelectedFacilityState(facility)
    if (facility) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(facility))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return (
    <FacilityContext.Provider
      value={{
        selectedFacility,
        setSelectedFacility,
        facilities,
        isLoading,
        error,
        refetch: loadFacilities,
      }}
    >
      {children}
    </FacilityContext.Provider>
  )
}
