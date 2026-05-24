# Prompt 03 — Authentication: Password Reset & Email Verification

## Task

Build the forgot password, reset password, and email verification flows. These are public pages (no auth required).

## API Hooks Used

From `@/lib/api/wms-saas-core-api/auth/auth`:
- `useAuthControllerForgotPassword` (POST /auth/forgot-password) — sends reset email
- `useAuthControllerResetPassword` (POST /auth/reset-password) — resets with token
- `useAuthControllerRegister` (POST /auth/register) — register a new admin
- `useAuthControllerVerifyEmail` (POST /auth/verify-email) — verify email with token

## Files to Create

### 1. `src/pages/auth/forgot-password.tsx`

Forgot password page:
- Email input field
- "Send Reset Link" button
- On success: show success message "Check your email for the reset link"
- Link back to Login page
- Validate email format
- Show error toast on failure

### 2. `src/pages/auth/reset-password.tsx`

Reset password page:
- Reads `token` from URL query parameter
- New password input
- Confirm password input
- Password requirements indicator (min 8 chars, uppercase, lowercase, number)
- "Reset Password" button
- On success: show success toast, redirect to `/login`
- If token is missing from URL, show error state

### 3. `src/pages/auth/register.tsx`

Registration page:
- Full name input
- Email input
- Password input
- Confirm password input
- Timezone dropdown (use common timezones)
- Locale dropdown (en, es, fr, de, etc.)
- "Create Account" button
- On success: show success toast "Account created! Check your email to verify.", redirect to `/login`
- Link back to Login page

### 4. `src/pages/auth/verify-email.tsx`

Email verification page:
- Reads `token` from URL parameter
- Auto-submits verification on page load
- Shows loading spinner while verifying
- On success: "Email verified! You can now log in." with link to login
- On error: "Verification failed. The link may be expired." with link to resend

## UI/UX Requirements

- All pages should match the same visual style as the Login page (centered card)
- Use card component, centered on page
- Back to Login link on all pages
- Toast notifications for success/error
- Disable submit buttons during API calls
- Show inline validation errors below inputs

## File Structure

All auth pages go in `src/pages/auth/`:
```
src/pages/auth/
├── login.tsx
├── mfa.tsx
├── register.tsx
├── forgot-password.tsx
├── reset-password.tsx
└── verify-email.tsx
```

## Route Updates

Add routes for:
- `/register` → Register
- `/forgot-password` → ForgotPassword
- `/reset-password` → ResetPassword
- `/verify-email` → VerifyEmail

These are PUBLIC routes (not wrapped in ProtectedRoute).

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. Navigate to `/forgot-password` — form renders
2. Enter email — should show success (unless backend email is misconfigured)
3. Navigate to `/register` — form renders with all fields
4. Password validation works (show strength indicator)
5. Toast on success/error works
