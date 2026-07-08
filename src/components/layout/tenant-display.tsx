import { BuildingIcon } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'

export function TenantDisplay() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Badge variant="secondary" className="h-7 gap-1.5 px-2 text-xs font-normal">
      <BuildingIcon className="size-3" />
      <span className="hidden sm:inline">{user.tenantName || user.tenantCode}</span>
    </Badge>
  )
}
