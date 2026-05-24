# Prompt 14 — Integrations & Compliance

## Task

Build the Integrations module (external service configuration) and Compliance module (compliance/retention policies).

## API Hooks Used

### Integrations

From `@/lib/api/wms-saas-core-api/integrations/integrations`:
- `IntegrationController_findAll` (GET /integrations)
- `IntegrationController_create` (POST /integrations)
- `IntegrationController_findOne` (GET /integrations/:id)
- `IntegrationController_update` (PATCH /integrations/:id)
- `IntegrationController_delete` (DELETE /integrations/:id)

Types: `CreateIntegrationDto`, `UpdateIntegrationDto`, `CreateIntegrationDtoConfig`, `CreateIntegrationDtoStatus`, `CreateIntegrationDtoSyncFrequency`

### Compliance

From `@/lib/api/wms-saas-core-api/compliance-retention/compliance-retention`:
- `ComplianceController_findAll` (GET /compliance/policies) — if available
- `ComplianceController_create` (POST /compliance/policies)
- `ComplianceController_findOne` (GET /compliance/policies/:id)
- `ComplianceController_update` (PATCH /compliance/policies/:id)
- `ComplianceController_delete` (DELETE /compliance/policies/:id)

Types: `CreateCompliancePolicyDto`, `UpdateCompliancePolicyDto`, `CreateRetentionPolicyDto`, `UpdateRetentionPolicyDto`

Note: Some compliance endpoints may be under `compliance-retention` module. Check the generated API files for exact function names.

## Files to Create

### 1. `src/pages/integrations/integrations-list.tsx`

Integrations list page:
- Card-based layout showing each integration as a card
- Card shows: Integration Name, Type (e.g., slack, zapier, custom), Status, Sync Frequency, Created
- "Add Integration" button
- Search by name
- Filter by type

**Status Badges:**
- Active → green
- Inactive → gray
- Error → red

**Row/Card Actions:**
- Edit Configuration
- Test Connection
- Toggle Active/Inactive
- Delete

### 2. `src/pages/integrations/integration-form-dialog.tsx`

Create/edit integration dialog:
- Integration Name (required)
- Type (select or text input)
- Config (dynamic JSON key-value editor):
  - Key: text input
  - Value: text or password field (for secrets)
  - Add/remove rows
- Status toggle
- Sync Frequency (select: realtime, hourly, daily, weekly, manual)
- Test Connection button (calls a test endpoint if available)
- Save/Cancel

### 3. `src/pages/compliance/compliance-list.tsx`

Compliance policies list page:
- Table columns: Policy Name, Type, Applies To, Status, Last Updated, Actions
- Search by name
- Filter by type
- "Create Policy" button

**Row Actions:**
- Edit Policy
- Delete

### 4. `src/pages/compliance/compliance-form-dialog.tsx`

Create/edit compliance policy dialog:
- Policy Name (required)
- Description
- Policy Type (select)
- Applies To (select: all tenants, specific tenants)
- Rules (dynamic JSON editor):
  - Rule name
  - Rule configuration
- Status toggle (Enabled/Disabled)
- Save/Cancel

### 5. `src/pages/compliance/retention-policy-section.tsx`

Retention policy section (can be part of compliance or separate):
- List of retention policies for audit logs, notifications, etc.
- Table: Resource Type, Retention Period, Enabled
- Edit retention period
- Toggle enable/disable

### 6. `src/hooks/integrations.ts` & `src/hooks/compliance.ts`

Custom hooks.

## UI/UX Requirements

- Integration cards in responsive grid
- Config editor: key-value pairs with add/remove, password fields masked
- Test Connection: shows success/failure toast
- Compliance: policy rules displayed as readable text, not raw JSON
- Retention: duration selector (number + unit: days, months, years)
- Loading skeletons for both list views
- Empty states: "No integrations configured" / "No compliance policies defined"

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/integrations` loads with integration cards
2. Add integration with config
3. Edit integration config
4. Test connection (if endpoint exists)
5. Toggle integration active/inactive
6. Delete integration
7. `/compliance` loads policies
8. Create compliance policy
9. Edit policy rules
10. Retention policy configuration
