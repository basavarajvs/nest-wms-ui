import { create } from 'zustand'

export interface Facility {
  id: string
  code: string
  name: string
  address?: string
}

interface FacilityState {
  selectedFacility: Facility | null
  facilities: Facility[]
  isLoading: boolean

  setFacilities: (facilities: Facility[]) => void
  selectFacility: (facility: Facility) => void
  clearFacility: () => void
  setLoading: (loading: boolean) => void
}

export const useFacilityStore = create<FacilityState>((set) => ({
  selectedFacility: null,
  facilities: [],
  isLoading: true,

  setFacilities: (facilities) => set({ facilities }),

  selectFacility: (facility) => {
    localStorage.setItem('facility_code', facility.code)
    localStorage.setItem('facility_id', facility.id)
    localStorage.setItem('facility_name', facility.name)
    set({ selectedFacility: facility })
  },

  clearFacility: () => {
    localStorage.removeItem('facility_code')
    localStorage.removeItem('facility_id')
    localStorage.removeItem('facility_name')
    set({ selectedFacility: null })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
