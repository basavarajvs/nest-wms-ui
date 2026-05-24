# nest-saas-ui — Master Plan

## Overview

Build a System Administration Portal for the WMS SaaS Core platform. This is NOT a tenant-facing app — it is the **admin panel** used by System Administrators and SaaS Core admins to manage the multi-tenant platform.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18+ (Vite) |
| UI Library | shadcn/ui (TailwindCSS + Radix) |
| Routing | TanStack Router (already in shadcn-admin) |
| Server State | TanStack Query (React Query) |
| HTTP Client | Axios (already configured in generated-client) |
| Icons | Lucide + Tabler (already in shadcn-admin) |
| Auth | JWT Bearer (via generated client's httpClient) |
| Build | Vite + TypeScript |
| Package Manager | pnpm |

## Project Location

`../nest-saas-ui/` (sibling to `wms-saas-core/`)

## Role-Based Navigation

Three tiers of navigation based on user roles:

### Tier 1 — System Admin (full access)
All menu items visible.

### Tier 2 — SaaS Admin (tenant-scoped admin)
Same menu as System Admin but with limited create/delete/edit capabilities enforced by CASL on the backend.

### Tier 3 — Read-Only / Support
Limited to viewing data (Dashboard, Audit Logs, notification viewing).

_Implementation: Use the `UserController_getMe` response to determine role. Store ability/permissions in auth context._

## Sidebar Navigation Structure

```
Dashboard            /                          (stats, charts, quick actions)
├── Platform
│   ├── Tenants      /tenants                  (CRUD, status, health)
│   ├── Users        /users                    (admins, invitations, roles)
│   ├── Roles        /roles                    (roles hierarchy, permissions)
│   ├── Groups       /groups                   (user groups)
│   └── Audit Logs   /audit                    (system-wide audit trail)
├── Billing
│   ├── Plans        /license-plans            (plan definitions)
│   └── Subscriptions /subscriptions           (tenant subscriptions, invoices)
├── Integrations
│   ├── API Keys     /api-keys                 (API key management)
│   ├── Webhooks     /webhooks                 (endpoints, events)
│   └── Integrations /integrations             (external service configs)
├── Communication
│   ├── Notifications /notifications           (templates, broadcast)
│   └── Templates    /notification-templates   (multi-channel templates)
├── Security
│   ├── Security     /security                 (security events)
│   ├── Compliance   /compliance               (policies)
│   └── Quotas       /quotas                   (resource limits, usage)
├── Settings
│   ├── System       /system                   (global settings)
│   ├── Tenant       /tenant-settings          (override settings by tenant)
│   └── Reports      /reports                  (report configs, generation)
└── Profile (top-right dropdown)
    ├── My Profile
    ├── Security (password, MFA, PIN)
    └── Logout
```

## Data Flow

```
[Frontend Component]
    → React Query Hook (from generated-client/lib/api/)
    → customInstance (Axios with auto auth headers)
    → Backend API (/api/v1/...)
    → Response Interceptor wraps in { success, data, meta, requestId, timestamp }
    → Component receives envelope, accesses .data for payload, .meta for pagination
```

## Auth Flow

```
Login Page
  → POST /auth/login (with email + password)
  → If 200: store { accessToken, refreshToken } in localStorage as 'auth_token'
  → If MFA required (202): show MFA challenge page
  → After auth: redirect to Dashboard
  → httpClient automatically attaches Bearer token to all requests
  → On 401: clear tokens, redirect to /login
```

## Known TypeScript Quirk

The generated orval types (e.g. `TenantController_findAllResponse200 = { data: void, status: 200 }`) do NOT match the actual runtime shape. The backend returns:

```json
{
  "success": true,
  "data": { ...actualPayload },
  "meta": { "total": 100, "page": 1, "limit": 20, "hasNext": true },
  "requestId": "uuid",
  "timestamp": "2026-..."
}
```

Always access the actual data via `response.data` (not `response.data.data`). The generated types will cause TS errors — either cast with `as any` or access properties defensively.

## Response Handling Pattern

```typescript
// For queries:
const { data, isLoading, error } = useHookName(params);
// data = { success: true, data: actualPayload, meta: {...}, requestId, timestamp }
const items = data?.data; // the actual array/object
const total = data?.meta?.total;

// For mutations:
const mutation = useMutationHook();
mutation.mutate(payload, {
  onSuccess: (response) => {
    // response = { success: true, data: result, ... }
    toast({ title: 'Success' });
  },
  onError: (error) => {
    // error.response.data = { success: false, error: { code, message, details } }
    toast({ title: 'Error', description: error.response?.data?.error?.message, variant: 'destructive' });
  }
});
```

## Testing Each Prompt

After each prompt, run:
```bash
pnpm run dev
```
And verify the page renders without errors. Check the browser console for any API issues.

## Prompt Execution Order

Run prompts in sequence. Each builds on the previous one.
