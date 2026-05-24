# Prompt 19 — Polish, Error Handling & Build Verification

## Task

Final polish pass: add error boundaries, loading states, empty states, improve UX, add a global error boundary, ensure build passes.

## Files to Create/Modify

### 1. `src/components/common/error-boundary.tsx`

React Error Boundary component:
```tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
```

- Catches React render errors
- Shows a friendly error page with:
  - Error icon
  - "Something went wrong" message
  - "Try Again" button that resets the boundary
  - Error details in a collapsible section (dev mode only)
- Logs errors to console

### 2. `src/components/common/error-state.tsx`

Reusable error state component:
```tsx
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: ReactNode;
}
```
Used across all pages when API calls fail.

### 3. `src/components/common/loading-state.tsx`

Reusable loading state:
```tsx
interface LoadingStateProps {
  type: 'table' | 'card' | 'detail' | 'form';
  rows?: number;
}
```
- `table`: renders N skeleton table rows
- `card`: renders N skeleton cards
- `detail`: renders skeleton for a detail page
- `form`: renders skeleton for a form

### 4. `src/components/common/empty-state.tsx`

Reusable empty state:
```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}
```
Used when lists have no data.

### 5. `src/components/common/confirm-dialog.tsx`

Reusable confirmation dialog:
```tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  isLoading?: boolean;
}
```
- Used for delete confirmations, status changes, dangerous actions
- Destructive variant shows red confirm button

### 6. `src/lib/error-handler.ts`

Centralized error handler for API errors:
```typescript
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Backend error format
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    // HTTP status messages
    switch (error.response?.status) {
      case 401: return 'Unauthorized. Please log in again.';
      case 403: return 'You do not have permission for this action.';
      case 404: return 'Resource not found.';
      case 429: return 'Too many requests. Please slow down.';
      case 500: return 'Server error. Please try again later.';
      default: return 'An unexpected error occurred.';
    }
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}
```

### 7. `src/components/common/page-header.tsx`

Reusable page header:
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode; // buttons to show in header
  breadcrumbs?: { label: string; href?: string }[];
}
```
Used at the top of every page for consistent title + actions layout.

### 8. Audit existing pages for consistency

Review ALL pages created in previous prompts and ensure they use:
- `PageHeader` component
- `ErrorState` for API errors
- `LoadingState` for loading
- `EmptyState` for empty data
- `ConfirmDialog` for destructive actions
- `getErrorMessage` for error messages in toasts

### 9. Fix TypeScript errors

Run `pnpm run typecheck` (check the project's lint/typecheck scripts) and fix any TS errors.

Common fixes needed:
- The generated client types may not match runtime (see master plan)
- Use `// @ts-ignore` or type assertions where generated types are incorrect
- Properly type API response access as `any` where needed

### 10. Build verification

```bash
pnpm run build
```

Fix any build errors.

## Edge Cases to Handle

### API Response Envelope

The backend wraps all responses in `{ success, data, meta, requestId, timestamp }`. Make sure all components access response data via `response.data` (the backend's data field).

```typescript
// CORRECT pattern:
const { data } = useQuery(...);
const tenants = data?.data; // backend's data field
const total = data?.meta?.total;

// For mutations:
mutation.mutate(payload, {
  onSuccess: (response) => {
    // response = { success: true, data: result }
    toast({ title: 'Success' });
  },
});
```

### Network Errors

Handle these gracefully:
- Network offline → show "No internet connection" toast
- Request timeout → show "Request timed out" with retry
- Server error (500) → show "Server error" with retry
- Rate limit (429) → show "Too many requests" with retry after countdown

### Auth Token Expiry

The httpClient already handles 401 by:
1. Clearing the token
2. Redirecting to `/login`

But there's no token refresh logic. If the backend supports token refresh, wrap Axios interceptor to:
1. On 401, try refresh token
2. If refresh succeeds, retry original request
3. If refresh fails, redirect to login

Check if the httpClient needs this enhancement:

```typescript
// src/lib/http/httpClient.ts — add refresh interceptor
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await AuthController_refresh({ refreshToken });
        const newToken = response.data?.accessToken;
        localStorage.setItem('auth_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return AXIOS_INSTANCE(originalRequest);
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### Mobile Responsiveness Audit

Check all pages render well on:
- Desktop (1280px+)
- Tablet (768px)
- Mobile (375px)

Key patterns:
- Tables → card layout on mobile
- Sidebar → overlay drawer on mobile
- Dialog → full-screen sheet on mobile
- Grid → single column on mobile

## Final Build Verification

```bash
pnpm run build
pnpm run dev
```

Verify:
1. All routes render without errors
2. All API calls succeed (check Network tab)
3. Loading states show on slow connections (use Chrome DevTools throttling)
4. Error states show when API is down (stop the backend)
5. Empty states show when API returns empty arrays
6. 401 redirects to /login
7. Mobile responsive on all pages
8. Dark mode toggle works on all pages
9. Build succeeds with `pnpm run build`

## Verification Checklist (Final)

- [ ] `pnpm run build` succeeds
- [ ] `pnpm run dev` starts without warnings
- [ ] Login page renders and authenticates
- [ ] Dashboard loads with data
- [ ] All sidebar navigation items navigate correctly
- [ ] Create/Edit/Delete flows work for all CRUD modules
- [ ] Pagination works on list pages
- [ ] Search/filter work on list pages
- [ ] Toast notifications show on success/error
- [ ] Error boundaries catch and display errors
- [ ] Loading skeletons show during API calls
- [ ] Empty states show when no data
- [ ] Confirmation dialogs appear before destructive actions
- [ ] Dark mode works everywhere
- [ ] Mobile responsive: pages don't break on small screens
- [ ] Auth token refresh works (if implemented)
- [ ] MFA flow works end-to-end
- [ ] Profile update saves correctly
- [ ] Password change works
