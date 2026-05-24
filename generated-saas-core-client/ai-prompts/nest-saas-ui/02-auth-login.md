# Prompt 02 — Authentication: Login, MFA, and Session Management

## Task

Build the authentication system. This includes the login page, MFA (TOTP) challenge flow, token management, and an auth context that wraps the entire app.

**IMPORTANT**: This is a System Admin portal. Users are SaaS core administrators. There is NO tenant code field — tenants manage their own apps elsewhere.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/auth/auth`:
- `useAuthControllerLogin` (POST /auth/login) — login with email + password
- `useAuthControllerRefresh` (POST /auth/refresh) — refresh access token
- `useAuthControllerLogout` (POST /auth/logout) — logout current session
- `useAuthControllerLogoutAll` (POST /auth/logout-all) — logout all sessions
- `useAuthControllerEnableMfa` (POST /auth/mfa/enable) — generates MFA secret + QR
- `useAuthControllerVerifyMfa` (POST /auth/mfa/verify) — verifies TOTP code
- `useAuthControllerDisableMfa` (POST /auth/mfa/disable) — disables MFA

From `@/lib/api/wms-saas-core-api/users/users`:
- `useUserControllerGetMe` (GET /users/me) — get current user profile

## Files to Create

### 1. `src/contexts/auth-context.tsx`

Create an AuthContext and AuthProvider that:

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResponse>;
  loginWithMfa: (email: string, password: string, totpCode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}
```

Key behaviors:
- On mount, check if `auth_token` exists in localStorage
- If yes, call `useUserControllerGetMe` to get user profile
- Store user info (id, email, name, roles) in context state
- Handle MFA challenge flow: if login returns 202 (MFA required), store partial token and show MFA page
- On logout: call `AuthController_logout`, clear localStorage, redirect to /login
- Expose `isAuthenticated`, `user`, `login`, `logout`, etc.

### 2. `src/lib/auth/storage.ts`

Token storage utilities:
```typescript
const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clearRefreshToken: () => localStorage.removeItem(REFRESH_KEY),
  
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};
```

### 3. `src/pages/auth/login.tsx`

Login page with:
- Email input
- Password input
- "Remember me" checkbox (stores email in localStorage for convenience)
- Submit button with loading state
- "Forgot Password?" link
- On success: store tokens, redirect to `/`
- On MFA required: redirect to `/mfa` with state

Form validation:
- Email: required, valid email format
- Password: required, min 8 chars

Show error toast on failure using the sonner toast already in shadcn-admin.

### 4. `src/pages/auth/mfa.tsx`

MFA challenge page:
- Shows text: "Enter the 6-digit code from your authenticator app"
- 6-digit input field (auto-focus, one input or 6 individual inputs)
- Submit button
- On success: store full tokens, redirect to `/`

### 5. `src/components/auth/protected-route.tsx`

A wrapper component that:
- If loading auth state → show a full-page spinner (use the shadcn spinner pattern)
- If not authenticated → redirect to `/login`
- If authenticated → render children

### 6. Update routing

In `src/main.tsx` or the router setup (TanStack Router is used in shadcn-admin):
- Add `/login` route → Login page
- Add `/mfa` route → MFA challenge page  
- Wrap protected routes with `<ProtectedRoute>`

Keep the Dashboard route as `/` for now (it can show a placeholder until Prompt 05).

### 7. Update `src/App.tsx`

Wrap the entire app with `AuthProvider` and `QueryClientProvider`.

```typescript
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <TooltipProvider>
      <ThemeProvider>
        <Router>
          <Routes />
        </Router>
      </ThemeProvider>
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
```

Note: The httpClient (`src/lib/http/httpClient.ts`) already reads `auth_token` from localStorage and attaches it as `Authorization: Bearer` header automatically. It also handles 401 by clearing the token and redirecting to `/login`. So after storing the token, all subsequent API calls are authenticated.

## UI/UX Requirements

- Use shadcn `Button`, `Input`, `Label`, `Card`, `Toast` components
- Dark mode support (shadcn-admin already has theme toggle)
- Responsive: centered card on desktop, full width on mobile
- Show "Connecting..." or spinner during login
- On error: show toast with backend error message (extract from `error.response.data.error.message`)
- After 3 failed attempts, show "Too many attempts. Please try again later."

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. Navigate to `/login` — should show login form
2. Enter invalid credentials — should show error toast
3. Enter valid credentials — should redirect to `/`
4. The httpClient should attach the Bearer token to subsequent requests
5. MFA flow: if user has MFA enabled, login redirects to `/mfa`
6. After logout, redirect to `/login` and localStorage is cleared

## Error Handling

The backend returns errors in this format:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials",
    "details": [],
    "requestId": "uuid",
    "timestamp": "...",
    "path": "/api/v1/auth/login"
  }
}
```

Extract `error.response?.data?.error?.message` for display.
