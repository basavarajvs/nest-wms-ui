# Prompt 10 — License Plans Management

## Task

Build the License Plans module. License plans define what features and limits a subscription provides (e.g., Basic, Pro, Enterprise).

## API Hooks Used

From `@/lib/api/wms-saas-core-api/license-plans/license-plans`:
- `LicensePlanController_findAll` (GET /license-plans)
- `LicensePlanController_create` (POST /license-plans) — check generated file for exact name
- `LicensePlanController_findOne` (GET /license-plans/:id) — if available
- `LicensePlanController_update` (PATCH /license-plans/:id) — if available
- `LicensePlanController_delete` (DELETE /license-plans/:id) — if available

Types: `CreateLicensePlanDto`, `UpdateLicensePlanDto`, `CreateLicensePlanDtoFeatures`, `CreateLicensePlanDtoLimits`, `CreateLicensePlanDtoLicenseType`

## Files to Create

### 1. `src/pages/license-plans/plans-list.tsx`

License plans list page:
- Card-based layout (not table — plans are better displayed as cards, like pricing cards)
- Each card shows:
  - Plan name (e.g., "Basic", "Pro", "Enterprise")
  - Monthly/Yearly price
  - License type (monthly, yearly, perpetual)
  - Status (Active/Inactive) badge
  - Feature list (from `features` JSON)
  - Limits (from `limits` JSON)
  - Actions: Edit, Delete
- "Create Plan" button
- Search by name
- Filter by status

### 2. `src/pages/license-plans/plan-form-dialog.tsx`

Create/edit plan dialog (or slide-over for more space):
- Plan Name (required)
- License Type (select: monthly, yearly, perpetual)
- Features (dynamic form):
  - Key-value pair list (add/remove rows)
  - Each feature is a name + description or boolean flag
- Limits (dynamic form):
  - Key-value pair list
  - e.g., "max_users": 10, "storage_gb": 5, "api_calls": 10000
- Price (number input)
- Currency (default: USD)
- Status toggle (Active/Inactive)
- Submit/Cancel

### 3. `src/hooks/license-plans.ts`

Custom hooks for license plan data fetching.

## UI/UX Requirements

- Plan cards instead of table (more visual, easier to compare)
- Cards in responsive grid: 3 columns desktop, 2 tablet, 1 mobile
- Features displayed as a bullet list within the card
- Limits displayed as labeled badges or small tags
- Edit opens the same form dialog but pre-filled
- Delete with confirmation
- Status badge: Active (green), Inactive (gray)
- Loading: card skeleton placeholders
- Empty state: "No plans defined. Create your first plan."

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/license-plans` loads with plan cards
2. Create plan with features and limits
3. Edit plan to change price or features
4. Toggle plan active/inactive
5. Delete plan (if allowed)
6. Card layout responsive at different widths
