import { describe, it, expect, beforeEach } from 'vitest'
import { useFacilityStore } from '../facility-store'

const mockFacility = {
  id: '1',
  code: 'WH-MAIN',
  name: 'Main Warehouse',
  address: '123 Industrial Blvd',
}

const mockFacilities = [
  mockFacility,
  { id: '2', code: 'WH-SEC', name: 'Secondary Warehouse' },
]

describe('useFacilityStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useFacilityStore.setState({
      selectedFacility: null,
      facilities: [],
      isLoading: true,
    })
  })

  it('starts with initial state', () => {
    const state = useFacilityStore.getState()
    expect(state.selectedFacility).toBeNull()
    expect(state.facilities).toEqual([])
    expect(state.isLoading).toBe(true)
  })

  it('setFacilities updates the facilities list', () => {
    useFacilityStore.getState().setFacilities(mockFacilities)
    expect(useFacilityStore.getState().facilities).toEqual(mockFacilities)
  })

  it('selectFacility sets the selected facility and persists to localStorage', () => {
    useFacilityStore.getState().selectFacility(mockFacility)

    const state = useFacilityStore.getState()
    expect(state.selectedFacility).toEqual(mockFacility)

    expect(localStorage.getItem('facility_code')).toBe('WH-MAIN')
    expect(localStorage.getItem('facility_id')).toBe('1')
    expect(localStorage.getItem('facility_name')).toBe('Main Warehouse')
  })

  it('clearFacility resets selected facility and removes localStorage items', () => {
    localStorage.setItem('facility_code', 'WH-MAIN')
    localStorage.setItem('facility_id', '1')
    localStorage.setItem('facility_name', 'Main Warehouse')

    useFacilityStore.getState().clearFacility()

    expect(useFacilityStore.getState().selectedFacility).toBeNull()
    expect(localStorage.getItem('facility_code')).toBeNull()
    expect(localStorage.getItem('facility_id')).toBeNull()
    expect(localStorage.getItem('facility_name')).toBeNull()
  })

  it('setLoading updates loading state', () => {
    useFacilityStore.getState().setLoading(false)
    expect(useFacilityStore.getState().isLoading).toBe(false)

    useFacilityStore.getState().setLoading(true)
    expect(useFacilityStore.getState().isLoading).toBe(true)
  })

  it('preserves facilities when setting loading', () => {
    useFacilityStore.getState().setFacilities(mockFacilities)
    useFacilityStore.getState().setLoading(false)

    const state = useFacilityStore.getState()
    expect(state.facilities).toEqual(mockFacilities)
    expect(state.isLoading).toBe(false)
  })

  it('overwrites selected facility when selecting a new one', () => {
    useFacilityStore.getState().selectFacility(mockFacility)
    const newFacility = {
      id: '3',
      code: 'WH-NEW',
      name: 'New Warehouse',
    }
    useFacilityStore.getState().selectFacility(newFacility)

    expect(useFacilityStore.getState().selectedFacility).toEqual(newFacility)
  })
})
