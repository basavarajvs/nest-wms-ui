import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { AuthLayout } from '@/features/auth/auth-layout'

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email.').email('Invalid email address.'),
  password: z
    .string()
    .min(1, 'Please enter your password.')
    .min(7, 'Password must be at least 7 characters long.'),
  tenantCode: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { redirect } = useSearch({ from: '/(auth)/login' })
  const { login } = useAuth()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantCode: '',
    },
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError(null)

    const result = await login({
      email: data.email,
      password: data.password,
      tenantCode: data.tenantCode || undefined,
    })

    if (result.success) {
      navigate({ to: redirect || '/', replace: true })
    } else {
      setError(result.error ?? 'Login failed')
    }

    setIsLoading(false)
  }

  return (
    <AuthLayout>
      <Card className="max-w-sm gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password below to log into{' '}
            <br className="max-sm:hidden" /> your account. Don't have an account?{' '}
            <Link
              to="/sign-up"
              className="text-nowrap underline underline-offset-4 hover:text-primary"
            >
              Sign Up
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                    <Link
                      to="/forgot-password"
                      className="absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
                    >
                      Forgot password?
                    </Link>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Code</FormLabel>
                    <FormControl>
                      <Input placeholder="your-tenant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button className="mt-2" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                Sign in
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking sign in, you agree to our{' '}
            <a
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
