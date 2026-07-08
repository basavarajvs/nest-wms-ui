import { describe, it, expect, beforeEach } from 'vitest'
import { useClientStore } from '../client-store'

const mockClient = { id: '1', code: 'CLT-001', name: 'Acme Corp' }
const mockClients = [
  mockClient,
  { id: '2', code: 'CLT-002', name: 'Globex Inc' },
]

describe('useClientStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useClientStore.setState({
      selectedClient: null,
      clients: [],
      isLoading: true,
    })
  })

  it('starts with initial state', () => {
    const state = useClientStore.getState()
    expect(state.selectedClient).toBeNull()
    expect(state.clients).toEqual([])
    expect(state.isLoading).toBe(true)
  })

  it('setClients updates the clients list', () => {
    useClientStore.getState().setClients(mockClients)
    expect(useClientStore.getState().clients).toEqual(mockClients)
  })

  it('selectClient sets the selected client and persists to localStorage', () => {
    useClientStore.getState().selectClient(mockClient)

    const state = useClientStore.getState()
    expect(state.selectedClient).toEqual(mockClient)

    expect(localStorage.getItem('client_code')).toBe('CLT-001')
    expect(localStorage.getItem('client_id')).toBe('1')
    expect(localStorage.getItem('client_name')).toBe('Acme Corp')
  })

  it('clearClient resets selected client and removes localStorage items', () => {
    localStorage.setItem('client_code', 'CLT-001')
    localStorage.setItem('client_id', '1')
    localStorage.setItem('client_name', 'Acme Corp')

    useClientStore.getState().clearClient()

    expect(useClientStore.getState().selectedClient).toBeNull()
    expect(localStorage.getItem('client_code')).toBeNull()
    expect(localStorage.getItem('client_id')).toBeNull()
    expect(localStorage.getItem('client_name')).toBeNull()
  })

  it('setLoading updates loading state', () => {
    useClientStore.getState().setLoading(false)
    expect(useClientStore.getState().isLoading).toBe(false)

    useClientStore.getState().setLoading(true)
    expect(useClientStore.getState().isLoading).toBe(true)
  })

  it('preserves other state when setting loading', () => {
    useClientStore.getState().setClients(mockClients)
    useClientStore.getState().setLoading(false)

    const state = useClientStore.getState()
    expect(state.clients).toEqual(mockClients)
    expect(state.isLoading).toBe(false)
  })

  it('overwrites selected client when selecting a new one', () => {
    useClientStore.getState().selectClient(mockClient)
    const newClient = { id: '3', code: 'CLT-003', name: 'New Client' }
    useClientStore.getState().selectClient(newClient)

    expect(useClientStore.getState().selectedClient).toEqual(newClient)
  })
})
