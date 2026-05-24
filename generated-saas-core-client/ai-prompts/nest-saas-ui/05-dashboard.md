# Prompt 05 — Dashboard Page

## Task

Build the main Dashboard page — the first thing users see after login. It should show key platform metrics, recent activity, and quick actions.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/health/health`:
- `useHealthControllerCheck` (GET /health) — health check

From `@/lib/api/wms-saas-core-api/tenants/tenants`:
- `useTenantControllerFindAll` (will be used via mutation pattern — check generated file)

From `@/lib/api/wms-saas-core-api/users/users`:
- `useUserControllerFindAll` (will be used via mutation pattern)

From `@/lib/api/wms-saas-core-api/system-admin/system-admin`:
- `useSystemAdminControllerGetStats` or similar (check the generated file for system stats)

From `@/lib/api/wms-saas-core-api/tenant-admin/tenant-admin`:
- `useTenantAdminControllerGetUsage` or similar (check generated file)

## Files to Create

### 1. `src/pages/dashboard/dashboard.tsx`

Dashboard layout with stat cards and charts:

**Top Row — Stat Cards (4 cards):**
- **Total Tenants**: Count of all registered tenants
- **Active Tenants**: Tenants with active status + active subscription
- **Total Users**: Count of all users across all tenants
- **System Health**: Green/Amber/Red status indicator from health endpoint

Each card shows:
- Icon (use Lucide icons)
- Numeric value (large, bold)
- Label
- Trend indicator (up/down from previous period — optional, can skip if API doesn't support)

**Middle Section — Two-column layout:**
- **Left: Recent Activity Feed**
  - List of recent audit log entries (last 10)
  - Each entry shows: timestamp, action, user, tenant
  - "View All" link to Audit Logs page
- **Right: System Status**
  - Health check results
  - API version
  - Uptime if available
  - Redis status (if health endpoint provides it)
  - Database status

**Bottom Section:**
- **Quick Actions** — Button cards:
  - "Create Tenant" → navigate to /tenants
  - "View Audit Logs" → navigate to /audit
  - "Manage Users" → navigate to /users

### 2. Dashboard Metric Hooks

Since the generated client may use `useMutation` for GET requests (a codegen quirk), use the raw API functions wrapped in `useQuery`:

```typescript
// Example pattern for data fetching when generated hook is a mutation:
import { useQuery } from '@tanstack/react-query';
import { TenantController_findAll } from '@/lib/api/wms-saas-core-api/tenants/tenants';

export function useTenants() {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => TenantController_findAll(),
  });
}
```

Create a custom hook `src/hooks/use-dashboard.ts` that aggregates all dashboard data:

```typescript
export function useDashboard() {
  const tenants = useQuery({ queryKey: ['tenants', 'all'], queryFn: () => /* fetch */ });
  const health = useQuery({ queryKey: ['health'], queryFn: () => /* fetch */ });
  const users = useQuery({ queryKey: ['users', 'all'], queryFn: () => /* fetch */ });
  
  // ... aggregate data
  
  return {
    totalTenants: tenants.data?.data?.length || 0,
    activeTenants: tenants.data?.data?.filter(t => t.status === 'ACTIVE')?.length || 0,
    totalUsers: users.data?.data?.length || 0,
    healthStatus: health.data?.data?.status,
    isLoading: tenants.isLoading || health.isLoading,
    error: tenants.error || health.error,
  };
}
```

## UI/UX Requirements

- Use shadcn `Card`, `CardHeader`, `CardContent` for stat cards
- Stat cards in a responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Use `Skeleton` component for loading states (shadcn skeleton)
- Show "Failed to load" state with retry button if API calls fail
- Charts: Use simple CSS-based bars/progress indicators or a lightweight chart library
  - Check if shadcn-admin already includes recharts or chart.js
  - If not, add `recharts` via pnpm for simple bar/line charts
- Right column with System Status shows green dot + "Healthy" or red dot + "Unhealthy"
- Empty state: "No tenants yet" with "Create First Tenant" CTA

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. Dashboard loads with stat cards populated from API
2. Skeleton loading states show while data loads
3. Health check shows system status
4. Quick action buttons navigate correctly
5. Error state shows retry button
6. Responsive layout works on mobile viewport
