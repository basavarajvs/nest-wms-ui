# Prompt 16 — Security Events & Resource Quotas

## Task

Build the Security Events viewer and Resource Quotas management modules.

## API Hooks Used

### Security

From `@/lib/api/wms-saas-core-api/security/security`:
- `SecurityController_findAll` (GET /security/events with params) — list security events
- `SecurityController_findOne` (GET /security/events/:id) — event detail

Types: `SecurityControllerFindAllParams`

From `@/lib/api/wms-saas-core-api/system-admin/system-admin`:
- `SystemAdminController_getSecurityEvents` (system-wide security events)

### Resource Quotas

From `@/lib/api/wms-saas-core-api/resource-quotas-usage/resource-quotas-usage`:
- `QuotaController_findAll` (GET /quotas) — list quota definitions
- `QuotaController_create` (POST /quotas) — create quota
- `QuotaController_update` (PATCH /quotas/:id) — update quota
- `QuotaController_delete` (DELETE /quotas/:id) — delete quota
- `QuotaController_getUsageMetrics` (GET /quotas/usage with params) — usage metrics
- `QuotaController_recordUsage` (POST /quotas/usage) — record usage (if applicable)

Types: `CreateResourceQuotaDto`, `UpdateResourceQuotaDto`, `QuotaControllerGetUsageMetricsParams`, `RecordUsageMetricDto`

## Files to Create

### 1. `src/pages/security/security-events.tsx`

Security events page:
- Table columns: Timestamp, Event Type, Severity, Actor, Resource, IP Address, Location, Status
- Advanced filtering:
  - Date range picker
  - Event type filter (login, mfa, password_change, permission_change, api_key_created, etc.)
  - Severity filter (info, warning, critical)
  - Actor search
  - IP address search
- Severity badges:
  - Critical → red with dot
  - Warning → amber with dot
  - Info → blue with dot
- Search across all fields
- Pagination
- "Export" button (CSV)

**Row Actions:**
- View Details (dialog with full event info)
- Block IP (if event shows an IP, add to blocked IPs — if API supports it)

### 2. `src/pages/security/security-event-detail.tsx`

Security event detail (dialog):
- Event type with icon
- Timestamp
- Actor details (user info, if available)
- Resource details
- IP address and geolocation (if available)
- Metadata key-value pairs
- Actions: "Block IP" button (calls IP block API if available)

### 3. `src/pages/quotas/quotas-list.tsx`

Resource quotas list page:
- Table columns: Quota Name, Resource Type, Default Limit, Current Usage, Unit, Scope, Actions
- "Create Quota" button
- Search by name
- Filter by resource type

**Usage visualization:**
- Progress bar showing current usage vs limit
- Green ( < 60% ), Amber (60-85%), Red ( > 85% )
- Show "15/100 users" format

**Row Actions:**
- Edit
- View Usage History
- Delete

### 4. `src/pages/quotas/quota-form-dialog.tsx`

Create/edit quota dialog:
- Quota Name (required)
- Resource Type (select: users, api_calls, storage, bandwidth, custom)
- Default Limit (number, required)
- Unit (text: e.g., "users", "GB", "requests/min")
- Scope (tenant, system)
- Description
- Save/Cancel

### 5. `src/pages/quotas/quota-usage.tsx`

Quota usage overview page:
- Summary cards: total quotas, over-limit quotas, near-limit quotas
- Table: per-tenant quota usage
  - Tenant Name
  - Quota Name
  - Limit
  - Current Usage
  - Usage %
  - Status (within limit, near limit, over limit)
- Filter by tenant
- Filter by quota
- Export (CSV)

### 6. `src/hooks/security.ts` & `src/hooks/quotas.ts`

Custom hooks.

## UI/UX Requirements

- Security events: color-coded by severity
- IP blocking: confirmation dialog "Block IP {ip}? This will prevent all requests from this IP."
- Quota progress bars: use shadcn `Progress` component
- Quota over-limit: show warning icon and red color
- Usage trends: simple sparkline chart if data supports it
- Loading skeletons for both sections
- Empty states: "No security events" / "No quotas defined"

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/security` loads with security events
2. Filter by severity
3. Filter by date range
4. View event detail
5. Block IP from event (if API supports)
6. `/quotas` loads quota definitions
7. Create quota with limit
8. Edit quota limit
9. View usage metrics with progress bars
10. Filter usage by tenant
11. Delete quota
