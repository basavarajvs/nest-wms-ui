# Prompt 11 — Subscriptions & Billing

## Task

Build the Subscriptions & Billing module. View all tenant subscriptions, billing cycles, invoices, and payments.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/billing-subscriptions/billing-subscriptions`:
- `SubscriptionController_getMySubscription` (GET /billing/subscriptions/my) — current tenant's sub
- `SubscriptionController_findAllV2` (GET /billing/subscriptions/v2 with params) — list all
- `SubscriptionController_create` (POST /billing/subscriptions)
- `SubscriptionController_update` (PATCH /billing/subscriptions/:id) — if available
- `SubscriptionController_upgradeDowngrade` (POST /billing/subscriptions/:id/change-plan)
- `SubscriptionController_getInvoices` (GET /billing/subscriptions/invoices with params)
- `SubscriptionController_getInvoice` (GET /billing/subscriptions/invoices/:id)
- `BillingPlansController_create` (POST /billing/plans) — if available
- `PaymentController_create` (POST /billing/payments)

Types: `CreateSubscriptionDto`, `UpdateSubscriptionDto`, `UpgradeDowngradeDto`, `SubscriptionControllerFindAllV2Params`, `SubscriptionControllerGetInvoicesParams`, `CreatePaymentDto`, `ConfirmPaymentDto`

From `@/lib/api/wms-saas-core-api/billing-plans/billing-plans`:
- `BillingPlansController_findAll` (GET /billing/plans) — if available
- `BillingPlansController_create` (POST /billing/plans) — if available

From `@/lib/api/wms-saas-core-api/subscriptions-billing/subscriptions-billing`:
- Check if there are additional subscription-billing endpoints here

## Files to Create

### 1. `src/pages/subscriptions/subscriptions-list.tsx`

Subscriptions list page:
- Table columns: Tenant Name, Plan Name, Status, Billing Type, Start Date, End Date, Amount, Actions
- Search by tenant name
- Filter by status (Active, Expired, Suspended, Pending, Canceled)
- Filter by plan
- "Create Subscription" button

**Subscription Status Badges:**
- Active → green
- Expired → red
- Suspended → amber
- Pending → blue
- Canceled → gray

**Row Actions:**
- View Details
- Change Plan (upgrade/downgrade dialog)
- Cancel Subscription (confirmation)
- View Invoices

### 2. `src/pages/subscriptions/subscription-create-dialog.tsx`

Create subscription dialog:
- Tenant (searchable dropdown from tenants list)
- Plan (dropdown from license plans)
- Billing Type (monthly, yearly)
- Start Date (date picker)
- Submit/Cancel

### 3. `src/pages/subscriptions/subscription-change-plan-dialog.tsx`

Change plan dialog:
- Current plan displayed
- New plan dropdown (available plans)
- Proration info text (if applicable)
- Confirm/Cancel
- Calls upgrade/downgrade API

### 4. `src/pages/subscriptions/subscription-invoices.tsx`

Invoices list (can be a tab within subscription detail):
- Table columns: Invoice #, Description, Amount, Status, Date, Actions
- Filter by status (Paid, Pending, Overdue, Canceled)
- Pagination
- "Download" button (if PDF available)

### 5. `src/pages/subscriptions/payment-dialog.tsx`

Payment recording dialog:
- Amount
- Payment method (select: card, bank, cash, other)
- Transaction ID
- Notes
- Submit/Cancel

### 6. `src/hooks/subscriptions.ts`

Custom hooks for subscription data.

## UI/UX Requirements

- Reuse DataTable component
- Subscription detail can be a dialog with tabs (Overview, Invoices, Payments)
- Change plan dialog shows feature comparison (current vs new)
- Invoice status: Paid (green), Pending (amber), Overdue (red)
- Loading: skeleton table rows
- Empty: "No subscriptions found"
- Pagination on invoices list (could be many invoices per subscription)

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/subscriptions` loads all subscriptions
2. Filter by status
3. Search by tenant name
4. Create subscription for a tenant
5. Change plan for existing subscription
6. View invoices list
7. Pagination on invoices
