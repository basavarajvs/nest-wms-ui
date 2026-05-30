import { useContext } from 'react'
import {
  FacilityContext,
  type FacilityContextType,
} from '@/context/FacilityContext'

export function useFacility(): FacilityContextType {
  const context = useContext(FacilityContext)
  if (!context) {
    throw new Error('useFacility must be used within a FacilityProvider')
  }
  return context
}
