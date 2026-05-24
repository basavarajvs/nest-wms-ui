# Prompt 06 — Tenant Management

## Task

Build the Tenant Management module: list all tenants, create new tenants, view tenant details, update tenant status, and view tenant health.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/tenants/tenants`:
- `useTenantControllerCreate` (POST /tenants) — though it's typed as useQuery, use as mutation under the hood
- `TenantController_findOne` (GET /tenants/:id)
- `TenantController_updateStatus` (PATCH /tenants/:id/status)
- `TenantController_getHealth` (GET /tenants/:id/health)

From `@/lib/api/wms-saas-core-api/system-admin/system-admin`:
- Check for any system-level tenant listing endpoints

Note: Many of these are system-only endpoints. The httpClient will handle auth.

**Important**: Some generated hooks use `useMutation` for GET requests. Create wrapper hooks using `useQuery` directly for data fetching:

```typescript
export function useTenants(queryParams?: any) {
  return useQuery({
    queryKey: ['tenants', queryParams],
    queryFn: () => TenantController_findAll(queryParams),
  });
}
```

Check the actual generated API file to find the correct function name for listing tenants.

## Files to Create

### 1. `src/pages/tenants/tenants-list.tsx`

Tenants list page:
- Search bar (search by name or code)
- Status filter dropdown (Active, Suspended, Pending, All)
- Table with columns: Name, Code, Status, Subscription, Users Count, Created At, Actions
- Pagination (use backend pagination via `meta.total`, `meta.page`, `meta.limit`)
- "Create Tenant" button in header

**Tenant Status Badges:**
- Active → green badge
- Suspended → red badge
- Pending → amber badge
- Expired → gray badge

**Row Actions (dropdown):**
- View Details (navigate to `/tenants/:id`)
- Change Status (opens dialog)
- View Health (opens health dialog)

### 2. `src/pages/tenants/tenant-create-dialog.tsx`

Create tenant dialog/modal:
- Tenant Name (required)
- Tenant Code (required, auto-generated suggestion from name)
- Domain (optional)
- License Plan (dropdown, fetched from license-plans API)
- Admin Email (required — first admin user's email)
- Admin Name (required)
- Submit/Cancel buttons
- On success: toast "Tenant created successfully", close dialog, refresh list

### 3. `src/pages/tenants/tenant-detail.tsx`

Tenant detail page (reachable at `/tenants/:id`):
- Shows full tenant information
- Tabs:
  - **Overview**: General info, status, dates
  - **Health**: Health check status, last check time
  - **Subscription**: Current plan, status, expiry
  - **Settings**: Tenant-specific settings
- Edit button to change status
- Back to list button

### 4. `src/pages/tenants/tenant-status-dialog.tsx`

Change status dialog:
- Current status displayed
- New status dropdown (Active, Suspended, Expired)
- Reason text field (optional)
- Confirm/Cancel
- On confirm: call update status API, show toast, refresh

### 5. `src/components/features/tenants/tenant-health-card.tsx`

Health status card component:
- Green/Amber/Red status indicator
- Last checked timestamp
- Error message if unhealthy
- "Check Now" button

## UI/UX Requirements

- Use shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Pagination using shadcn `Pagination` component
- Search with debounce (300ms delay)
- Status filter as a `Select` component
- "Create Tenant" opens a `Dialog` (not a separate page)
- Change status also uses a `Dialog`
- Table row click navigates to detail
- Empty state: "No tenants found" with illustration
- Loading: `<Skeleton>` rows in table
- Error: inline error with retry button

## Data Table Pattern

Use a reusable data table (shadcn-admin may already have one). If not, create a generic one:

```typescript
// src/components/common/data-table.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading: boolean;
  pagination?: { page: number; limit: number; total: number };
  onPageChange?: (page: number) => void;
  searchTerm?: string;
  onSearch?: (term: string) => void;
  filters?: React.ReactNode;
}
```

This pattern will be reused across ALL list pages (users, roles, groups, etc.).

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. Navigate to `/tenants` — table loads with tenant data
2. Search by name — results filter (check API respects it)
3. Filter by status — only matching tenants shown
4. Click "Create Tenant" — dialog opens with form
5. Fill and submit — success toast, table refreshes
6. Click status badge — status change dialog opens
7. Change status — API called, list refreshes
8. Navigate to `/tenants/:id` — detail page renders
9. Health tab shows health status
10. Pagination works if >20 tenants
