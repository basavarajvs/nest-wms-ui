# Prompt 17 — System & Tenant Settings

## Task

Build the System Settings and Tenant Settings configuration modules.

## API Hooks Used

### System Settings

From `@/lib/api/wms-saas-core-api/system/system`:
- `SystemController_getSettings` (GET /system/settings) — list system settings
- `SystemController_getSetting` (GET /system/settings/:key) — get single setting
- `SystemController_updateSetting` (PUT /system/settings/:key) — update setting

Types: `CreateSystemSettingDto`, `UpdateSystemSettingDto`

From `@/lib/api/wms-saas-core-api/system-admin/system-admin`:
- `SystemAdminController_getSettings` (GET /system-admin/settings) — if separate
- `SystemAdminController_updateSetting` (PUT /system-admin/settings/:key)

### Tenant Settings

From `@/lib/api/wms-saas-core-api/tenant-settings-config/tenant-settings-config`:
- `TenantSettingsController_findAll` (GET /tenant-settings) — list tenant settings
- `TenantSettingsController_create` (POST /tenant-settings) — create setting
- `TenantSettingsController_update` (PATCH /tenant-settings/:id) — update
- `TenantSettingsController_delete` (DELETE /tenant-settings/:id) — delete

Types: `CreateTenantSettingDto`, `UpdateTenantSettingDto`

From `@/lib/api/wms-saas-core-api/tenant-admin/tenant-admin`:
- `TenantAdminController_getConfigOverrides` (GET /tenant-admin/config-overrides)
- `TenantAdminController_setConfigOverride` (POST /tenant-admin/config-overrides)
- `TenantAdminController_removeConfigOverride` (DELETE /tenant-admin/config-overrides/:key)

Types: `CreateTenantConfigOverrideDto`, `UpdateTenantConfigOverrideDto`

### Tenant Admin (health, usage)

From `@/lib/api/wms-saas-core-api/tenant-admin/tenant-admin`:
- `TenantAdminController_getHealth` (GET /tenant-admin/health)
- `TenantAdminController_getUsage` (GET /tenant-admin/usage with params)

Types: `TenantAdminControllerGetUsageParams`

## Files to Create

### 1. `src/pages/system/system-settings.tsx`

System settings page:
- Settings grouped by category (General, Auth, Security, Email, API, etc.)
- Each setting displayed as a form field:
  - String settings: text input
  - Boolean settings: toggle switch
  - Number settings: number input
  - Select settings: dropdown
- "Save" button per group or global "Save All"
- Search/filter settings by key or category
- Reset to default for individual settings

**Example settings to display:**
- Site name
- Support email
- Session timeout (minutes)
- Max login attempts
- Password policy (min length, require special chars)
- MFA enforcement
- Allowed CORS origins
- Rate limit configuration (TTL, limit)
- Email configuration (from name, from email)

### 2. `src/pages/system/system-setting-edit.tsx`

Since settings are dynamic (defined in the database), render them generically:
```typescript
// Read the setting's category and value type from the API
// Render appropriate input based on type
```

### 3. `src/pages/tenant-settings/tenant-settings-list.tsx`

Tenant settings page:
- "Select Tenant" dropdown/search at top (to choose which tenant's settings to view)
- Shows selected tenant's settings
- Settings grouped by category
- Same form pattern as system settings but scoped to tenant
- "Override" toggle for each setting (to use tenant-specific value)
- Save/Cancel per tenant

If backend API doesn't support per-tenant setting queries by ID, allow choosing a tenant and then show settings:

### 4. `src/pages/tenant-settings/tenant-config-overrides.tsx`

Config overrides section:
- Table: Config Key, Current Value, Overridden Value, Actions
- "Add Override" button
- Edit/Remove overrides
- Shows which configs are currently overridden for the selected tenant

### 5. `src/pages/tenant-admin/tenant-health-monitor.tsx`

Tenant health monitor page:
- Select tenant dropdown
- Shows: Health status (green/amber/red), Last check timestamp, Error message (if any)
- "Check Now" button
- Usage metrics: API calls, storage, active users (from TenantAdminController_getUsage)
- Usage charts (simple bar/line charts using recharts)

### 6. `src/hooks/settings.ts` & `src/hooks/tenant-admin.ts`

Custom hooks.

## UI/UX Requirements

- Settings grouped by category with collapsible sections
- Toggle switches for boolean settings
- Save confirmation toast
- Reset to default: confirmation dialog
- Tenant selector: searchable combobox
- Config overrides: show the default value in muted text next to the override input
- Health: large status indicator (green/amber/red circle) with label
- Usage metrics: display as progress bars with labels
- Loading skeletons for settings forms
- Empty override state: "No custom overrides for this tenant"

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/system` loads with categorized settings
2. Toggle a boolean setting, save
3. Update a text setting, save
4. Search/filter settings
5. `/tenant-settings` loads with tenant selector
6. Select a tenant → settings load
7. Override a setting for selected tenant
8. Remove override
9. `/tenant-admin` loads with tenant selector
10. Check tenant health
11. View usage metrics
