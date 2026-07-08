import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { APP_CONFIG } from '@/config/app-config'
import { PackageIcon } from 'lucide-react'

export const Route = createFileRoute('/(auth)/login')({
  beforeLoad: () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [tenantCode, setTenantCode] = useState('')
  const [credential, setCredential] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(tenantCode, credential, password)
      toast.success('Logged in successfully')
      router.navigate({ to: '/' })
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 pb-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <PackageIcon className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold">{APP_CONFIG.name}</h1>
            <p className="text-sm text-muted-foreground">
              Warehouse Management System
            </p>
          </div>
        </div>
        <Card>
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the warehouse system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenantCode">Tenant Code</Label>
                <Input
                  id="tenantCode"
                  placeholder="DE0001"
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential">Email / Username</Label>
                <Input
                  id="credential"
                  placeholder="name@company.com"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
