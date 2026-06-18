import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AcceptInvitePage } from '@/features/auth/accept-invite'

const searchSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export const Route = createFileRoute('/(auth)/accept-invite')({
  component: AcceptInvitePage,
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (!search.token) {
      throw redirect({ to: '/login' })
    }
  },
})
