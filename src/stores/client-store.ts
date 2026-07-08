import { create } from 'zustand'

export interface Client {
  id: string
  code: string
  name: string
}

interface ClientState {
  selectedClient: Client | null
  clients: Client[]
  isLoading: boolean

  setClients: (clients: Client[]) => void
  selectClient: (client: Client) => void
  clearClient: () => void
  setLoading: (loading: boolean) => void
}

export const useClientStore = create<ClientState>((set) => ({
  selectedClient: null,
  clients: [],
  isLoading: true,

  setClients: (clients) => set({ clients }),

  selectClient: (client) => {
    localStorage.setItem('client_code', client.code)
    localStorage.setItem('client_id', client.id)
    localStorage.setItem('client_name', client.name)
    set({ selectedClient: client })
  },

  clearClient: () => {
    localStorage.removeItem('client_code')
    localStorage.removeItem('client_id')
    localStorage.removeItem('client_name')
    set({ selectedClient: null })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
