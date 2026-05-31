# WMS UI — AI Prompt-Based Implementation Plan

> **Scope:** Web UI only (no RF/Mobile)  
> **Format:** Each prompt is self-contained and can be passed to an AI code generation tool  
> **Target:** `nest-wms-ui` frontend (React 19, TanStack Router, TanStack Query, shadcn/ui, Zod)  
> **Backend:** NestJS WMS API (generated OpenAPI client exists)  
> **Reference:** `reference-wms-ui-frontend` (LightCrate WMS) for UX patterns

---

## How to Use This Document

Each section is an **AI prompt** that includes:

| Section | Purpose |
|---------|---------|
| **Context** | Background information the AI needs to understand before generating code |
| **Task** | Specific instructions on what code to generate |
| **Files to Create/Modify** | Exact file paths and what to do with each |
| **Verification** | How to confirm the generated code works correctly |
| **Backend Dependencies** | APIs that must exist on the backend; flagged as **[GAP]** if missing |

Prompts are ordered by **execution dependency** — complete them sequentially.

---

## Table of Contents

- [Phase 0: Foundation & Quick Wins](#phase-0-foundation--quick-wins)
  - [Prompt F-01: Centralized Status Badge System](#prompt-f-01-centralized-status-badge-system)
  - [Prompt F-02: DataTable Standardization Across All Pages](#prompt-f-02-datatable-standardization-across-all-pages)
  - [Prompt F-03: Reusable Stepper/Wizard Component](#prompt-f-03-reusable-stepperwizard-component)
  - [Prompt F-04: Missing Data Layer Hooks](#prompt-f-04-missing-data-layer-hooks)
- [Phase 1: Inbound Domain](#phase-1-inbound-domain)
  - [Prompt I-01: ASN List Page with Server-Side DataTable](#prompt-i-01-asn-list-page-with-server-side-datatable)
  - [Prompt I-02: ASN Lines CRUD (Backend + Frontend)](#prompt-i-02-asn-lines-crud-backend--frontend)
  - [Prompt I-03: ASN Creation Wizard (3-Step)](#prompt-i-03-asn-creation-wizard-3-step)
  - [Prompt I-04: ASN Detail Dialog](#prompt-i-04-asn-detail-dialog)
  - [Prompt I-05: GRN Enhancement with Line Items (Backend + Frontend)](#prompt-i-05-grn-enhancement-with-line-items-backend--frontend)
  - [Prompt I-06: ASN Receiving Dialog with Real-Time Progress](#prompt-i-06-asn-receiving-dialog-with-real-time-progress)
  - [Prompt I-07: Putaway Board Enhancement](#prompt-i-07-putaway-board-enhancement)
- [Phase 2: Outbound Domain](#phase-2-outbound-domain)
  - [Prompt O-01: Order Lines CRUD (Backend + Frontend)](#prompt-o-01-order-lines-crud-backend--frontend)
  - [Prompt O-02: Sales Order Creation Wizard (3-Step)](#prompt-o-02-sales-order-creation-wizard-3-step)
  - [Prompt O-03: Sales Order Detail Dialog](#prompt-o-03-sales-order-detail-dialog)
  - [Prompt O-04: Order Workbench (Unified View)](#prompt-o-04-order-workbench-unified-view)
  - [Prompt O-05: Wave Management Optimization](#prompt-o-05-wave-management-optimization)
  - [Prompt O-06: Shipping Label Wizard](#prompt-o-06-shipping-label-wizard)
  - [Prompt O-07: Load Planning Enhancement](#prompt-o-07-load-planning-enhancement)
- [Phase 3: Quality & Inventory Domain](#phase-3-quality--inventory-domain)
  - [Prompt QI-01: QC Inspection Workflow (Backend + Frontend)](#prompt-qi-01-qc-inspection-workflow-backend--frontend)
  - [Prompt QI-02: Quality Dashboard](#prompt-qi-02-quality-dashboard)
  - [Prompt QI-03: Cycle Count Execution UI (Backend + Frontend)](#prompt-qi-03-cycle-count-execution-ui-backend--frontend)
  - [Prompt QI-04: Holds Create/Release (Backend + Frontend)](#prompt-qi-04-holds-createrelease-backend--frontend)
  - [Prompt QI-05: LPN Inquiry Dashboard with Barcode Generation](#prompt-qi-05-lpn-inquiry-dashboard-with-barcode-generation)
  - [Prompt QI-06: Replenishment Feature (Backend + Frontend)](#prompt-qi-06-replenishment-feature-backend--frontend)
- [Phase 4: Operations & Enterprise](#phase-4-operations--enterprise)
  - [Prompt E-01: Warehouse Setup Wizard (Backend + Frontend)](#prompt-e-01-warehouse-setup-wizard-backend--frontend)
  - [Prompt E-02: Aisle/Bay/Rack Management (Backend + Frontend)](#prompt-e-02-aislebayrack-management-backend--frontend)
  - [Prompt E-03: Role-Based Navigation](#prompt-e-03-role-based-navigation)
  - [Prompt E-04: Audit Logs Page](#prompt-e-04-audit-logs-page)
  - [Prompt E-05: Business Rules Configuration](#prompt-e-05-business-rules-configuration)
  - [Prompt E-06: Dashboard Real Data Enhancement](#prompt-e-06-dashboard-real-data-enhancement)
- [Backend API Gap Summary](#backend-api-gap-summary)

---

## Phase 0: Foundation & Quick Wins

---

### Prompt F-01: Centralized Status Badge System

**Context:**  
The current project renders status values inconsistently — each page uses inline `<Badge>` with ad-hoc color mapping (e.g., `status === 'created' ? 'bg-slate-500' : 'bg-blue-500'`). The reference project uses a centralized status badge system where each domain has a dedicated badge component mapping status enums to `{ variant, label, className }` configs. This creates visual inconsistency and makes status lifecycle changes difficult.

The reference project's approach is at `reference-wms-ui-frontend/src/components/status-badges/StatusBadges.tsx` and `reference-wms-ui-frontend/src/types/warehouse-statuses.ts`.

**Task:**  
Create a centralized status badge component system in the current project. For each domain, define:
1. A TypeScript enum/type with all possible statuses
2. A config map: `Record<StatusEnum, { variant: BadgeVariant; label: string; className?: string }>`
3. A badge component that accepts the status enum and renders `<Badge>` with the correct config

**Domains to cover (start with these; more can be added):**
- ASN Status: `CREATED`, `IN_TRANSIT`, `ARRIVED`, `IN_RECEIVING`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CLOSED`, `CANCELLED`
- GRN Line Status: `OPEN`, `RECEIVED`, `INSPECTING`, `INSPECTED`, `PUTAWAY_PENDING`, `PUTAWAY_DONE`, `CANCELLED`
- ASN Line Status: `OPEN`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`
- Order Status: `CREATED`, `VALIDATED`, `ALLOCATED`, `RELEASED`, `PICKED`, `PACKED`, `SHIPPED`, `CANCELLED`
- Picking Task Status: `CREATED`, `AVAILABLE`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `EXCEPTION`, `CANCELLED`
- Cycle Count Status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `VARIANCE`, `CANCELLED`
- QC Status: `NOT_REQUIRED`, `PENDING`, `PASSED`, `FAILED`
- Variance Type: `NONE`, `DAMAGED`, `SHORT`, `OVER`
- Load Status: current statuses used in the project
- LPN Status: current statuses used in the project

**Files to Create:**
- `src/types/warehouse-statuses.ts` — All status enums/types + valid transition maps (like `VALID_ASN_STATUS_TRANSITIONS`)
- `src/components/status-badges/StatusBadges.tsx` — All badge components, each is a named export function taking the status value
- `src/components/status-badges/index.ts` — Barrel exports

**Files to Modify:**
- After creating badges, update at least 3 existing pages to use them (e.g., `OrderList.tsx`, `WaveList.tsx`, `Load management pages`) to demonstrate the pattern. Replace inline `className` logic with `<AsnStatusBadge status={item.status} />` etc.

**Verification:**
1. Import a badge component in any page and verify it renders the correct color+label for each status value
2. Verify all status values have a mapping (no `undefined` or fallback to default)
3. Verify TypeScript compilation passes: `npx tsc -b --noEmit`
4. Visual check: open a page that uses badges and confirm colors match warehouse conventions (red for cancelled, green for completed, yellow for pending, blue for in-progress)

**Backend Dependencies:** None (purely frontend types)

---

### Prompt F-02: DataTable Standardization Across All Pages

**Context:**  
The project has a fully built `DataTable` component library in `src/components/data-table/` (toolbar, pagination, faceted filter, column header, view options, bulk actions) but **no page uses it**. Every page uses raw `<Table>` from shadcn with manual state management — duplicating pagination logic, filter state, and column sorting. This is the highest-ROI change in the codebase.

**Task:**  
Replace all raw `<Table>` usages with the `DataTable` component across every list page. The `DataTable` wrappers expect a `@tanstack/react-table` table instance. Steps:

1. For each page, define columns using `ColumnDef<T, any>[]` with proper accessor keys, header labels, and cell renderers
2. Replace raw `<Table>` + manual `<Pagination>` with `<DataTablePagination table={table} />`
3. Add `<DataTableToolbar table={table} searchKey="..." filters={[...]} />` where applicable
4. Add sortable column headers using `<DataTableColumnHeader column={column} title="..." />`
5. Ensure `useTableUrlState()` hook is used for URL-persisted table state (pagination, sorting, filters)

**Pages to convert (in priority order):**
1. `src/features/outbound/orders/` — Order list (replace `OrderList.tsx` raw table)
2. `src/features/inventory/stock/` — Stock levels list
3. `src/features/inbound/putaway-board/` — Putaway board table
4. `src/features/outbound/waves/` — Wave list
5. `src/features/purchase-orders/` — Purchase order list (note: this has expandable rows for lines — preserve this)
6. `src/features/inventory/adjustments/` — Adjustment list
7. `src/features/inventory/holds/` — Holds list
8. `src/features/inventory/low-stock/` — Low stock list
9. `src/features/lpns/` — LPN list
10. `src/features/carriers/` — Carrier list
11. `src/features/vendors/` — Vendor list
12. `src/features/clients/` — Client list
13. `src/features/brands/` — Brand list
14. `src/features/warehouse/` — Facilities, Zones, Locations lists
15. `src/features/transfers/` — Transfers list

**Important pattern to preserve:** For `PurchaseOrders.tsx`, the expandable row with line sub-table must be preserved. The `DataTable` component supports row expansion — use `getRowCanExpand()` and render a sub-component.

**Files to Modify:** Each page listed above (component file + potentially its columns definition)

**Verification:**
1. Every converted page must show a search/filter toolbar, sortable column headers, and pagination with page size selector
2. Sorting by clicking column headers must work (asc → desc → none toggle)
3. Pagination must remember page number between navigation (URL-synced via `useTableUrlState`)
4. Existing CRUD dialogs must still work (create, edit, delete)
5. TypeScript compilation: `npx tsc -b --noEmit`
6. Lint: `npm run lint`

**Backend Dependencies:** None (purely frontend refactoring)

---

### Prompt F-03: Reusable Stepper/Wizard Component

**Context:**  
The current project has zero multi-step flows. The reference project uses a consistent wizard pattern for complex entity creation (ASN, Sales Orders, Shipping Labels). A `StepperDialog` component is needed as a foundation — it will be used by multiple wizards in later phases.

The reference pattern (`SalesOrderCreateWizard.tsx`) uses:
- `STEPS` array: `[{ id, title, description }]`
- `currentStep` state (0-indexed number)
- `getStepStatus(index)` returning `'completed' | 'current' | 'pending'`
- Visual: numbered circles with connector lines, color-coded by status
- Navigation: Back/Next/Cancel buttons, validation before advancing

**Task:**  
Create a reusable `StepperDialog` component that wraps `Dialog` from shadcn and provides:
1. Step indicator header with numbered circles and connector lines
2. Navigation footer with Back/Next/Cancel (or Submit on last step)
3. Step validation callback (`onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>`)
4. Step change callback (`onStepChange: (step: number) => void`)
5. Slots for rendering step content and step icons
6. Supports both `number` and `string` step identifiers

Also create:
- `src/components/wizard/StepperDialog.tsx` — Main component
- `src/components/wizard/StepperStep.tsx` — Individual step wrapper
- `src/components/wizard/types.ts` — TypeScript types
- `src/components/wizard/index.ts` — Barrel exports

**Props for `StepperDialog`:**
```typescript
interface Step {
  id: string
  title: string
  description?: string
}

interface StepperDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  steps: Step[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete: () => void | Promise<void>
  onCancel?: () => void
  onBeforeNext?: (currentStep: number) => boolean | Promise<boolean>
  title?: string
  children: React.ReactNode // one child per step, indexed by currentStep
}
```

**Files to Create:**
- `src/components/wizard/StepperDialog.tsx`
- `src/components/wizard/types.ts`
- `src/components/wizard/index.ts`

**Verification:**
1. Render a test page with a 3-step wizard (Basic Info → Details → Review)
2. Verify step circles are numbered, connected by lines, and colored by status
3. Verify Back/Next/Cancel navigation works
4. Verify `onBeforeNext` can prevent advancement (return false)
5. Verify dialog closes on complete
6. TypeScript compilation: `npx tsc -b --noEmit`

**Backend Dependencies:** None

---

### Prompt F-04: Missing Data Layer Hooks

**Context:**  
Several features have incomplete data layers — queries or mutations are missing. These are small, well-defined gaps that block dependent UI work. The generated API client already has the underlying functions; they just need TanStack Query wrappers.

**Task:**  
Create missing query/mutation hooks for the following. Each hook should follow the existing pattern: `queryKey: ['wms', domain, ...params]`, use the generated client function, and have appropriate `staleTime`.

| Domain | Missing Hook | Generated Client Function | Priority |
|--------|-------------|--------------------------|----------|
| ASN | `useAsns(params?)` — list with pagination | `InboundWebController_getAsns` (exists in client) | 🔴 Critical |
| GRN | `useGrns(params?)` — list with pagination | Needs to be created (may not exist in generated client — check) | 🔴 Critical |
| LPN | `useLpnHierarchy(id)` — nested hierarchy | `LpnWebController_getHierarchy` (exists in client) | 🟡 High |
| LPN | `useProductAvailableQty(productId, params?)` | `LpnWebController_productAvailableQty` (exists in client) | 🟡 Medium |
| Transfers | `useReceiveTransfer()` mutation | Needs backend endpoint | 🟡 High |
| Transfers | `useTransferLines(transferId)` + CRUD | Needs backend endpoint | 🟡 High |
| Cycle Counts | `useSubmitCountLine()` mutation | `CountWebController_batchSubmitLines` (exists) | 🔴 Critical |
| Cycle Counts | `useCountSummary(params?)` query | `CountWebController_summary` (exists) | 🟡 High |
| Holds | `useCreateHold()` mutation | Needs backend endpoint | 🔴 Critical |
| Holds | `useReleaseHold()` mutation | Needs backend endpoint | 🔴 Critical |
| Categories | `useCategories()` query + CRUD mutations | No generated client — needs backend | 🔴 Critical |
| Inventory Transactions | Investigate if backend endpoint exists | May not exist — check | 🟡 Medium |

**Where to create:**
- `src/features/inbound/asns/data/asn-queries.ts` — Add `useAsns`
- `src/features/inbound/goods-receipt/data/grn-queries.ts` — Add `useGrns` (or new file `grn-list-queries.ts`)
- `src/features/lpns/data/lpn-queries.ts` — Add `useLpnHierarchy`, `useProductAvailableQty`
- `src/features/cycle-counts/data/cycle-count-queries.ts` — Add `useSubmitCountLine`, `useCountSummary`
- `src/features/inventory/holds/data/hold-queries.ts` — Add `useCreateHold`, `useReleaseHold`
- `src/features/items/categories/data/category-queries.ts` — New file, full CRUD
- `src/features/transfers/data/transfer-queries.ts` — Add `useReceiveTransfer`, `useTransferLines`

**Verification:**
1. Each hook must follow the existing pattern: generated client call wrapped in `useQuery`/`useMutation` with proper query keys and cache invalidation
2. TypeScript compilation: `npx tsc -b --noEmit`
3. For hooks using existing generated client functions, verify the function signature matches
4. For hooks marked **[GAP]**, create a placeholder that returns empty data and logs a warning

**Backend Dependencies:**
- **[GAP] ASN List** — `InboundWebController_getAsns` may exist in generated client but verify the actual backend has this endpoint
- **[GAP] GRN List** — Backend may not expose GRN list; needs to be added
- **[GAP] Transfer Lines** — Backend needs Transfer Line CRUD endpoints
- **[GAP] Transfer Receive** — Backend needs `POST /api/v1/wms/web/transfers/{id}/receive`
- **[GAP] Holds Create/Release** — Backend needs `POST /api/v1/wms/web/inventory/holds` and `POST /api/v1/wms/web/inventory/holds/{id}/release`
- **[GAP] Categories CRUD** — Backend needs Categories controller (or use SaaS Core API if available)

---

## Phase 1: Inbound Domain

---

### Prompt I-01: ASN List Page with Server-Side DataTable

**Context:**  
The current ASN page (`src/features/inbound/asns/`) only has a create mutation and a preview-by-ID tool. There is no list view, no pagination, no filters, and no row actions. The reference project (`AsnPage.tsx`) has a full-featured ASN dashboard with stats cards, search, filters, server-side pagination, and status-driven action menus.

**Prerequisites:** Prompt F-02 (DataTable), Prompt F-04 (useAsns hook)

**Task:**  
Rewrite the ASN list page to be a comprehensive operational dashboard:
1. **Stats cards** at the top: Pending (CREATED + SENT), In Transit (IN_TRANSIT), Arrived (ARRIVED), Received (RECEIVED + CLOSED). Each card shows count and navigates to filtered view.
2. **DataTable** with server-side pagination, sorting, and filtering. Columns: ASN Number, PO Number, Vendor, Carrier, Expected Date, Status (using `AsnStatusBadge` from F-01), Actions
3. **Search bar** with global text search
4. **Status filter** using `DataTableFacetedFilter`
5. **Row action dropdown** (MoreVertical) with context-sensitive actions:
   - Manage Lines (if status is CREATED/IN_TRANSIT)
   - Mark Arrived (if status is CREATED/IN_TRANSIT)
   - Start Receiving (if status is ARRIVED)
   - View Details (always)
   - Edit (if status is CREATED)
   - Cancel (if status is CREATED)
   - Delete (if status is CREATED)
6. **Create ASN button** that opens the ASN Creation Wizard (I-03) — initially a placeholder, wired up when I-03 is complete

**Where to locate:** The current ASN route is at `src/routes/_authenticated/inbound/asns.tsx` (or similar). The page component should be in `src/features/inbound/asns/`. Use the existing page structure.

**For the action mapping pattern:** Implement `getAllowedActions(status)` function returning `Record<string, boolean>` like the reference:
```typescript
const getAllowedActions = (status?: string) => ({
  manageLines: status === 'CREATED' || status === 'IN_TRANSIT',
  markArrived: status === 'CREATED' || status === 'IN_TRANSIT',
  startReceiving: status === 'ARRIVED',
  view: true,
  edit: status === 'CREATED',
  cancel: status === 'CREATED',
  delete: status === 'CREATED',
})
```

**Verification:**
1. ASN list displays with correct data when the API returns data
2. Sorting by any column works
3. Status filter filters correctly
4. Row action menu shows only allowed actions based on status
5. Clicking "Create ASN" opens a dialog (placeholder is acceptable until I-03)
6. Stats cards show correct counts (even if 0)
7. TypeScript compilation passes

**Backend Dependencies:** `InboundWebController_getAsns` endpoint must exist with pagination support

---

### Prompt I-02: ASN Lines CRUD (Backend + Frontend)

**Context:**  
This is the most critical gap. The current `CreateAsnDto` has no line items. A real ASN must specify what products are expected. The reference project has `AsnLineItemsDialog.tsx` for managing lines on an existing ASN, and the wizard creates lines as part of the ASN creation flow.

**This prompt requires both backend and frontend work.**

---

#### Backend Part: ASN Lines API

**Files to Create (Backend):**
- `AsnLineController.java` (or equivalent in the NestJS backend) with endpoints:
  - `GET /api/v1/wms/web/asn-lines?asnId={asnId}` — List lines for an ASN
  - `POST /api/v1/wms/web/asn-lines` — Create a line
  - `PATCH /api/v1/wms/web/asn-lines/{id}` — Update a line
  - `DELETE /api/v1/wms/web/asn-lines/{id}` — Delete a line

**AsnLine entity/DTO fields:**
```
id: string (UUID)
asnId: string (foreign key to ASN)
productId: string
productName?: string
expectedQuantity: number
receivedQuantity?: number
uomId: string
lotNumber?: string
expiryDate?: string (ISO date)
lineNumber: number (auto-generated)
notes?: string
```

**Existing generated client:** After creating the backend endpoints, regenerate the OpenAPI client to expose these functions. Alternatively, if the backend already has these endpoints but they weren't in the generated client, they just need to be added to the client.

---

#### Frontend Part: ASN Lines UI

**Files to Create (Frontend):**
- `src/features/inbound/asns/data/asn-line-queries.ts` — Query hooks:
  - `useAsnLines(asnId)` with pagination
  - `useCreateAsnLine()` mutation
  - `useUpdateAsnLine()` mutation
  - `useDeleteAsnLine()` mutation
- `src/features/inbound/asns/components/AsnLineItemsDialog.tsx` — Dialog for managing lines:
  - Table of existing lines with: Line #, Product (search select), Expected Qty, Received Qty, UOM, Lot#, Expiry, Actions (Edit/Delete)
  - "Add Line" button that opens inline form
  - Form fields: `ProductSearchSelect`, Quantity (number), UOM select, Lot number (optional), Expiry date (optional), Notes
  - Uses `react-hook-form` with `zod` validation
  - Validates: product required, quantity > 0, UOM required

**Where to place:** The dialog opens from the ASN list page action menu ("Manage Lines"). It receives `asnId` and `asnStatus` props.

**Verification:**
1. Backend: Test each endpoint with curl/Postman to verify CRUD works
2. Frontend: Open ASN List → Click "Manage Lines" on a CREATED ASN → Verify dialog opens with empty list
3. Add a line → verify it appears in the table
4. Edit a line → verify changes persist
5. Delete a line → verify ConfirmDialog appears, then line is removed
6. Lines should NOT be editable when ASN status is beyond RECEIVED
7. After all lines are received, status should visually show "Partially Received" or "Received"

**Backend Dependencies:** **[GAP]** New backend endpoints needed for ASN Lines CRUD

---

### Prompt I-03: ASN Creation Wizard (3-Step)

**Context:**  
Building the ASN with a 3-step wizard that guides users through creating the ASN header, then adding line items, then reviewing before submission. This is the reference project's `AsnCreateWizard.tsx` pattern.

**Prerequisites:** Prompt F-03 (StepperDialog), Prompt I-02 (ASN Lines CRUD)

**Task:**  
Create `src/features/inbound/asns/components/AsnCreateWizard.tsx` — a 3-step wizard using the `StepperDialog` component.

**Step 1 — Basic Information:**
- Facility (auto-selected from context, read-only or disabled)
- Vendor (searchable `VendorSelect`)
- PO Number (text input)
- Carrier Name (text input or `CarrierSelect`)
- Tracking Number (text input)
- Expected Arrival Date (date picker)
- Notes (textarea)

**Step 2 — Line Items:**
- Interactive line items manager:
  - "Add Item" button that opens inline form row
  - Each row: Product (searchable `ProductSearchSelect`), Quantity (number input), UOM (select), Lot Number (optional), Expiry Date (optional), Remove button
  - Summary bar: Total Items count, Total Quantity
  - At least one line item is required

**Step 3 — Review & Create:**
- Summary cards: ASN Info (vendor, PO, carrier, dates), Line Items Summary table
- Line items table: Product, Qty, UOM, Lot#, Expiry
- "Create ASN" submit button

**Submission:** On submit, call `useCreateAsn()` mutation with the ASN header data. After ASN creation, call `useCreateAsnLine()` for each line item. Show success toast on completion.

**Files to Create:**
- `src/features/inbound/asns/components/AsnCreateWizard.tsx`
- `src/features/inbound/asns/components/wizard-steps/BasicInfoStep.tsx`
- `src/features/inbound/asns/components/wizard-steps/LineItemsStep.tsx`
- `src/features/inbound/asns/components/wizard-steps/ReviewStep.tsx`

**Verification:**
1. Open wizard from ASN List page "Create ASN" button
2. Step 1: Fill all fields → click Next → validation passes
3. Step 2: Add 2 items with valid data → verify summary bar updates → click Next
4. Step 2: Try to click Next with 0 items → validation prevents advancement
5. Step 3: Review all entered data → click "Create ASN"
6. Verify ASN appears in the list with status CREATED
7. Verify line items are associated with the ASN (open Manage Lines)
8. Verify toast notification on success

**Backend Dependencies:** ASN create endpoint must accept the fields in `CreateAsnDto`; ASN Lines endpoints from I-02 must be available

---

### Prompt I-04: ASN Detail Dialog

**Context:**  
Users need to view complete ASN information in a read-only dialog without navigating away from the list. The reference project's `AsnDetailsDialog.tsx` shows header info, shipping info, dates, and line items with barcodes.

**Prerequisites:** Prompt I-02 (ASN Lines CRUD)

**Task:**  
Create `src/features/inbound/asns/components/AsnDetailsDialog.tsx` — a read-only dialog showing:
1. **Header section:** ASN Number, Status (badge), PO Number, Created Date, Created By
2. **Vendor/Shipping section:** Vendor Name, Carrier, Tracking Number, Expected Arrival
3. **Line Items section:** Table with Product, Expected Qty, Received Qty, UOM, Lot#, Expiry, Status (badge). Show variance where received ≠ expected.
4. **Timeline/Audit section:** Status change history with timestamps

The dialog should use a `readOnly` prop pattern (true for detail view, false if ever used for editing).

**Files to Create:**
- `src/features/inbound/asns/components/AsnDetailsDialog.tsx`
- `src/features/inbound/asns/components/AsnDetailLineItemsTable.tsx` (reusable sub-component)

**Verification:**
1. Open from ASN List → click "View Details" action → dialog opens
2. All sections render with correct data
3. Line items table shows expected vs received quantities
4. Dialog is read-only — no edit/save buttons
5. Close button works

**Backend Dependencies:** ASN detail endpoint (`GET /api/v1/wms/web/inbound/asn/{id}`) must return ASN with line items

---

### Prompt I-05: GRN Enhancement with Line Items (Backend + Frontend)

**Context:**  
The current GRN has a progress view that shows raw JSON. Like ASN, a GRN must track line-level receipt — what products were received, in what quantities, with what variances. The reference project's `GrnLineItemsDialog.tsx` demonstrates this with variance badges (overage/shortage/match) and LPN barcode integration.

---

#### Backend Part: GRN Lines API

**Files to Create (Backend):**
- `GrnLineController.java` with endpoints:
  - `GET /api/v1/wms/web/grn-lines?grnId={grnId}` — List lines
  - `POST /api/v1/wms/web/grn-lines` — Create/receive line (with received quantity)
  - `PATCH /api/v1/wms/web/grn-lines/{id}` — Update line (e.g., adjust received qty)
  - `DELETE /api/v1/wms/web/grn-lines/{id}` — Delete line

**GrnLine fields:**
```
id: string
grnId: string
productId: string
productName?: string
expectedQuantity: number
receivedQuantity: number
uomId: string
lotNumber?: string
expiryDate?: string
varianceType?: 'NONE' | 'DAMAGED' | 'SHORT' | 'OVER'
damagedQuantity?: number
lineNumber: number
notes?: string
```

Also need `GET /api/v1/wms/web/inbound/grn` — list GRNs with pagination (if not already existing).

---

#### Frontend Part: GRN Lines UI

**Files to Create (Frontend):**
- `src/features/inbound/goods-receipt/data/grn-line-queries.ts` — Hooks:
  - `useGrnLines(grnId)` query
  - `useCreateGrnLine()` mutation
  - `useUpdateGrnLine()` mutation
  - `useDeleteGrnLine()` mutation
- `src/features/inbound/goods-receipt/components/GrnLineItemsDialog.tsx` — Dialog:
  - Pre-populated with expected lines from the ASN (if created from ASN)
  - Each line: Product, Expected Qty, field for Received Qty, UOM, Lot#, Expiry
  - Variance badge: green "Match" if expected === received, orange "Short" if received < expected, red "Over" if received > expected
  - Damaged quantity field + reason
  - "Add Line" for unexpected items (ad-hoc receipt)
- `src/features/inbound/goods-receipt/components/GrnDetailsDialog.tsx` — Detail view

**Files to Modify:**
- `src/features/inbound/goods-receipt/current GrnList.tsx` — Replace raw JSON progress with proper DataTable + line items dialog

**Verification:**
1. Create GRN from ASN → verify lines are populated from ASN
2. Enter received quantities for each line → variances are calculated and displayed
3. Add an unexpected (ad-hoc) line → verify it's added
4. Complete receiving → verify GRN status transitions work (Mark Arrived → Start Receiving → Receive → Complete)
5. Detail dialog shows full GRN with line items and variances

**Backend Dependencies:** **[GAP]** GRN Lines CRUD endpoints; **[GAP]** GRN list endpoint

---

### Prompt I-06: ASN Receiving Dialog with Real-Time Progress

**Context:**  
The receiving process is where warehouse operators physically check in goods. The reference project's `AsnReceivingDialog.tsx` walks through: ASN Validated → GRN Creation → Goods Receiving with real-time progress polling.

**Prerequisites:** Prompt I-05 (GRN with lines)

**Task:**  
Create `src/features/inbound/asns/components/AsnReceivingDialog.tsx` — a dialog that guides the receiving process:

**Step States:**
```typescript
type ReceivingStep = 'idle' | 'creating-grn' | 'grn-created' | 'in-progress' | 'completed' | 'error'
```

**Flow:**
1. **Idle:** Shows ASN summary (number, vendor, expected items count). "Start Receiving" button.
2. **Creating GRN:** Progress bar (indeterminate) with "Creating Goods Receipt Note..." text. Calls `useCreateGrnFromAsn()`.
3. **GRN Created:** Shows GRN number, progress bar at 33%. "Continue to Receive Items" button.
4. **In Progress:** Opens GRN Line Items dialog (from I-05) for entering received quantities. Progress bar advances as lines are completed (33% → 66% → 100%).
5. **Completed:** Green checkmark, "Receiving Complete" message, auto-closes after 3 seconds.
6. **Error:** Shows error message with Retry button.

**Polling:** After GRN creation, poll `useGrnProgress()` every 2 seconds until status changes from 'CREATING' to a terminal state.

**Files to Create:**
- `src/features/inbound/asns/components/AsnReceivingDialog.tsx`

**Verification:**
1. Click "Start Receiving" on an ARRIVED ASN → dialog opens
2. Follow flow through all steps → each transition works
3. Progress bar advances correctly
4. Error state shows with retry option
5. On completion, ASN list status updates to RECEIVED (or PARTIALLY_RECEIVED)
6. Verify toast notification on completion

**Backend Dependencies:**
- `useCreateGrnFromAsn` must work
- `useGrnProgress` must return meaningful progress states
- GRN Lines endpoints from I-05

---

### Prompt I-07: Putaway Board Enhancement

**Context:**  
The current putaway board (`src/features/inbound/putaway-board/`) has a kanban-style board and table but lacks task execution flow. The reference project integrates putaway as a natural step after GRN completion.

**Task:**  
Enhance the existing PutawayBoard page:
1. Add stats cards: Pending Putaway, In Progress, Completed, Total
2. Enhance the DataTable with: Task ID, Product, Expected Qty, Source Location (receiving dock), Suggested Destination, Status (badge), Assigned User, Priority, Actions
3. Add "Assign To" action — opens user select dialog
4. Add "View Details" — opens task detail with location guidance (source → destination)
5. Add status-driven actions: Start (for PENDING), Complete (for IN_PROGRESS), Cancel (for PENDING)
6. Connect the board to the GRN completion flow — when GRN is completed, a putaway task appears here

**Files to Modify:**
- `src/features/inbound/putaway-board/` — Existing page, enhance with DataTable and action menus
- `src/features/inbound/putaway-board/components/PutawayTaskDetailDialog.tsx` — New, task detail view

**Verification:**
1. Putaway board shows tasks grouped by status
2. Filters work (status, assigned user, priority)
3. "Assign To" action opens user selection dialog
4. Status transitions work (Start → In Progress → Complete)
5. Verify that completing a GRN creates a putaway task

**Backend Dependencies:**
- `InboundWebController_getPutawayBoard` must return task data with user assignments
- Backend may need PUT endpoint for updating putaway task status

---

## Phase 2: Outbound Domain

---

### Prompt O-01: Order Lines CRUD (Backend + Frontend)

**Context:**  
The current `CreateOrderDto` has no line items. Like ASN, sales orders must specify what products are being ordered. The reference project's `LineItemsStep.tsx` handles this as part of the order wizard.

**This prompt requires both backend and frontend work.**

---

#### Backend Part: Order Lines API

**Files to Create (Backend):**
- `OrderLineController.java` with endpoints:
  - `GET /api/v1/wms/web/order-lines?orderId={orderId}` — List lines for an order (with pagination)
  - `POST /api/v1/wms/web/order-lines` — Create a line
  - `PATCH /api/v1/wms/web/order-lines/{id}` — Update a line
  - `DELETE /api/v1/wms/web/order-lines/{id}` — Delete a line

**OrderLine fields:**
```
id: string
orderId: string
productId: string
productName?: string
quantity: number
allocatedQuantity?: number
pickedQuantity?: number
packedQuantity?: number
shippedQuantity?: number
uomId: string
unitPrice?: number
lineNumber: number
notes?: string
```

---

#### Frontend Part: Order Lines UI

**Files to Create (Frontend):**
- `src/features/outbound/orders/data/order-line-queries.ts` — Hooks:
  - `useOrderLines(orderId)` with pagination
  - `useCreateOrderLine()` mutation
  - `useUpdateOrderLine()` mutation
  - `useDeleteOrderLine()` mutation
- `src/features/outbound/orders/components/OrderLineItemsDialog.tsx` — Dialog:
  - Table of lines: Line #, Product, Qty, Allocated, Picked, Packed, UOM, Unit Price, Line Total, Actions
  - Add line form: ProductSearchSelect, Quantity, UOM, Unit Price
  - Edit line: modify quantity/UOM/price (only if not yet allocated)

**Pattern to follow:** `src/features/purchase-orders/` already implements the exact header+lines pattern with expandable rows. Replicate that approach.

**Verification:**
1. Backend: Test each endpoint
2. Frontend: Open Order List → "Manage Lines" on a CREATED order
3. Add 2-3 lines → verify totals calculate correctly
4. Edit line → verify changes persist
5. Delete line → verify removal
6. Lines should not be editable when order is ALLOCATED or beyond

**Backend Dependencies:** **[GAP]** New backend endpoints for Order Lines CRUD

---

### Prompt O-02: Sales Order Creation Wizard (3-Step)

**Context:**  
The reference project's `SalesOrderCreateWizard.tsx` guides users through customer selection, adding line items with pricing, and reviewing before submission.

**Prerequisites:** Prompt F-03 (StepperDialog), Prompt O-01 (Order Lines CRUD)

**Task:**  
Create `src/features/outbound/orders/components/SalesOrderCreateWizard.tsx` — a 3-step wizard.

**Step 1 — Basic Information:**
- Client/Customer (searchable `ClientSelect`)
- Order Type (select: STANDARD, RUSH, REPLENISHMENT, TRANSFER)
- Priority (select 1-5 with labels)
- Requested Delivery Date (date picker)
- Delivery Address (multi-line text or address fields)
- Notes (textarea)

**Step 2 — Line Items:**
- Add items: ProductSearchSelect, Quantity, UOM, Unit Price
- Line items table: Product, Qty, UOM, Unit Price, Line Total, Remove
- Summary bar: Item Count, Total Quantity, Total Value (sum of qty × price)
- At least one line item required

**Step 3 — Review & Create:**
- Order Summary card: Client, Type, Priority, Delivery Date
- Delivery Address card
- Line Items table with totals
- "Create Order" submit button

**Submission:** Call `useCreateOrder()` mutation, then `useCreateOrderLine()` for each line item. On success, close wizard and show toast.

**Files to Create:**
- `src/features/outbound/orders/components/SalesOrderCreateWizard.tsx`
- `src/features/outbound/orders/components/wizard-steps/BasicInfoStep.tsx`
- `src/features/outbound/orders/components/wizard-steps/LineItemsStep.tsx`
- `src/features/outbound/orders/components/wizard-steps/ReviewStep.tsx`

**Verification:**
1. Open wizard from Order List → "Create Order" button
2. Step 1: Fill all fields → Next
3. Step 2: Add 3 items with different products → verify totals → Next
4. Step 2: Try Next with 0 items → validation prevents
5. Step 3: Review all → "Create Order"
6. Verify order appears in list with CREATED status
7. Verify line items are associated

**Backend Dependencies:** Order create + Order Lines endpoints

---

### Prompt O-03: Sales Order Detail Dialog

**Context:**  
Users need to inspect order details including line items, allocation status, and fulfillment progress. The reference project's `SalesOrderDetailsDialog.tsx` provides this.

**Prerequisites:** Prompt O-01 (Order Lines CRUD)

**Task:**  
Create `src/features/outbound/orders/components/SalesOrderDetailsDialog.tsx`:
1. **Header:** Order Number, Status (badge), Client, Priority, Created Date
2. **Fulfillment Progress:** Visual bars for Allocated %, Picked %, Packed %, Shipped %
3. **Line Items table:** Product, Qty Ordered, Qty Allocated, Qty Picked, Qty Packed, Qty Shipped, UOM, Unit Price, Line Total
4. **Delivery Info:** Delivery Address, Requested Date, Actual Ship Date
5. **Timeline:** Status change history

**Files to Create:**
- `src/features/outbound/orders/components/SalesOrderDetailsDialog.tsx`

**Verification:**
1. Open from Order List → "View Details" action → dialog renders
2. All sections show correct data
3. Fulfillment progress bars update correctly based on line item quantities
4. Read-only — no edit capability

**Backend Dependencies:** Order detail endpoint must return lines with fulfillment quantities

---

### Prompt O-04: Order Workbench (Unified View)

**Context:**  
Warehouse admins need a unified view of the order lifecycle — from creation through allocation, wave assignment, and fulfillment progress. The reference project's `OrderWorkbenchPage.tsx` provides this consolidated dashboard.

**Prerequisites:** Prompt O-02 (Sales Order Wizard), Prompt O-03 (Detail Dialog)

**Task:**  
Create `src/features/outbound/orders/pages/OrderWorkbenchPage.tsx` — a consolidated view:
1. **Stats bar:** Total Orders, Pending Allocation, Allocated, In Wave, Picked, Packed, Shipped
2. **Order list with expandable rows:**
   - Each row: Order #, Client, Status, Priority, Item Count, Total Qty, Allocated %, Fulfilled %, Actions
   - Expand to show line items inline (reuse pattern from Purchase Orders)
3. **Quick actions per row:**
   - View Details (opens O-03 dialog)
   - Assign to Wave (opens wave selection dialog)
   - Override Allocation (opens allocation override dialog — exists as `useOverrideAllocation`)
   - Cancel (if CREATED status)
4. **Filters:** Status (multi-select), Client, Priority, Date Range, Search (order # or client name)

**Files to Create:**
- `src/features/outbound/orders/pages/OrderWorkbenchPage.tsx`
- `src/features/outbound/orders/pages/WaveAssignmentDialog.tsx` — small dialog for assigning orders to waves

**Files to Modify:**
- Route: Update the orders route to point to the workbench instead of the old list
- The old `OrderList.tsx` can remain or be replaced

**Verification:**
1. Workbench shows all orders with stats cards
2. Expand a row to see line items
3. "Assign to Wave" action opens wave selection (list available waves)
4. Clicking View Details opens the SalesOrderDetailsDialog
5. Filters work correctly

**Backend Dependencies:** Order list endpoint must return data needed for stats; wave list endpoint must exist for wave assignment dialog

---

### Prompt O-05: Wave Management Optimization

**Context:**  
The current wave page (`src/features/outbound/waves/`) has a basic kanban board and table. The reference project adds wave optimization panels, pick task generation, and visual wave representations.

**Task:**  
Enhance the existing wave page:
1. **Wave Creation Enhancement:** Add order selection dialog that allows selecting which orders to include in a wave (multi-select from unassigned orders)
2. **Wave detail dialog:** Show included orders with their line items, total pick quantities, and status
3. **Pick Task Generation:** "Generate Pick Tasks" button on a RELEASED wave — calls a mutation that creates individual pick tasks from wave orders
4. **Wave status management:** Create → Release → Generating Picks → Completed

**Files to Create:**
- `src/features/outbound/waves/components/WaveCreateDialog.tsx` — enhanced with order picker
- `src/features/outbound/waves/components/WaveDetailDialog.tsx` — wave contents view
- `src/features/outbound/waves/components/GeneratePickTasksDialog.tsx` — pick task generation
- `src/features/outbound/waves/data/wave-queries.ts` — add `useReleaseWave`, `useGeneratePickTasks` (if endpoints exist)

**Verification:**
1. Create wave with selected orders → verify wave appears in board
2. Open wave detail → verify orders are listed
3. Release wave → status changes to RELEASED
4. Generate Pick Tasks → verify tasks are created (check via console logs or API)
5. If pick tasks endpoint doesn't exist, show placeholder toast

**Backend Dependencies:**
- Wave creation endpoint must accept order IDs
- **[GAP]** Pick task generation endpoint (`POST /api/v1/wms/web/waves/{id}/generate-pick-tasks`) may be needed

---

### Prompt O-06: Shipping Label Wizard

**Context:**  
The reference project's `ShippingLabelWizard.tsx` provides a 4-step wizard for creating shipping labels: Package Details → Carrier Selection → Label Options → Review & Print.

**Prerequisites:** Prompt F-03 (StepperDialog)

**Task:**  
Create `src/features/outbound/shipments/components/ShippingLabelWizard.tsx` — a 4-step wizard:

**Step 1 — Shipment Details:**
- Order Number (search/select from orders)
- Destination Address
- Packaging Type (BOX, ENVELOPE, PALLET)
- Weight and Dimensions

**Step 2 — Carrier & Service:**
- Carrier (select from carriers list)
- Service Level (Ground, Express, Overnight, etc.)
- Rate display (from rate shopping API if available)

**Step 3 — Label Options:**
- Label Format (PDF, ZPL, EPL)
- Number of copies
- Include packing slip (toggle)

**Step 4 — Review & Generate:**
- Summary of all selections
- "Generate Label" button → calls `useGenerateShippingLabel()`
- Display generated label preview (image if available)
- "Print" button → calls `usePrintShippingLabel()`

**Files to Create:**
- `src/features/outbound/shipments/components/ShippingLabelWizard.tsx`
- `src/features/outbound/shipments/components/wizard-steps/ShipmentDetailsStep.tsx`
- `src/features/outbound/shipments/components/wizard-steps/CarrierSelectionStep.tsx`
- `src/features/outbound/shipments/components/wizard-steps/LabelOptionsStep.tsx`
- `src/features/outbound/shipments/components/wizard-steps/ReviewLabelStep.tsx`

**Verification:**
1. Open wizard from Shipping Labels page
2. Complete all 4 steps → verify preview renders
3. "Generate Label" calls the API → verify label appears in the list
4. "Print" triggers print/download

**Backend Dependencies:** `ShippingLabelsWebController_generate` and `_printLabel` must exist in generated client (they do)

---

### Prompt O-07: Load Planning Enhancement

**Context:**  
The current load page has basic CRUD. Load planning involves assigning shipments to loads, tracking dock assignments, and managing the loading process.

**Task:**  
Enhance the existing load page:
1. **Load create/update:** Add fields for dock assignment, carrier, driver, vehicle plate
2. **Load detail dialog:** Show assigned shipments, loading progress
3. **Load status management:** CREATED → LOADING → LOADED → DEPARTED
4. **Add shipment to load:** Dialog to select shipments and add them to a load

**Files to Create/Modify:**
- `src/features/loads/components/LoadCreateDialog.tsx` — enhanced with dock/carrier/driver
- `src/features/loads/components/LoadDetailDialog.tsx` — load contents view
- `src/features/loads/components/AddShipmentToLoadDialog.tsx` — shipment assignment
- `src/features/loads/data/load-queries.ts` — add `useLoadShipments(loadId)` query

**Verification:**
1. Create load with dock assignment → verify dock appears
2. Add shipments to load → verify they appear in detail
3. Update load status → verify badge changes
4. Mark as DEPARTED → verify status

**Backend Dependencies:** Load CRUD endpoints exist (`LoadWebController_*`); need shipment assignment endpoint

---

## Phase 3: Quality & Inventory Domain

---

### Prompt QI-01: QC Inspection Workflow (Backend + Frontend)

**Context:**  
The current project has no quality inspection workflow. The reference project's `QualityInspectionWorkflow.tsx` and `QcInspectionDialog.tsx` provide comprehensive inspection forms with checklists, photo evidence, and variance tracking.

---

#### Backend Part: Quality Inspection API

**Files to Create (Backend):**
- `QualityInspectionController.java` with endpoints:
  - `GET /api/v1/wms/web/quality/inspections` — List inspections (paginated, filterable)
  - `GET /api/v1/wms/web/quality/inspections/{id}` — Get inspection detail
  - `POST /api/v1/wms/web/quality/inspections` — Create inspection (linked to GRN)
  - `POST /api/v1/wms/web/quality/inspections/{id}/start` — Start inspection
  - `POST /api/v1/wms/web/quality/inspections/{id}/complete` — Complete inspection with results

**QualityInspection fields:**
```
id: string
grnId: string
grnNumber?: string
productId: string
productName?: string
inspectorId: string
status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'
sampleSize: number
passCount: number
failCount: number
defectCodes?: string[]
notes?: string
photoUrls?: string[]
inspectedAt?: string
createdAt: string
```

**Note:** Some of these endpoints may already exist in the generated client (`InboundWebController_startInspection`, `InboundWebController_completeInspection`, `InboundWebController_inspectQc`, `InboundWebController_applyDisposition`). Verify and use if they already exist. Only create new endpoints for what's missing.

---

#### Frontend Part: Quality Inspection UI

**Files to Create (Frontend):**
- `src/features/quality/data/quality-queries.ts` — Hooks:
  - `useQualityInspections(params?)` with pagination
  - `useQualityInspection(id)` detail
  - `useStartInspection()` mutation
  - `useCompleteInspection()` mutation
  - `useInspectQc()` mutation (for the inspection form submission)
- `src/features/quality/components/InspectionList.tsx` — DataTable of inspections
- `src/features/quality/components/QcInspectionDialog.tsx` — Form dialog:
  - Product info card
  - Sample size input
  - Pass/Fail radio or Pass Count / Fail Count inputs
  - Defect type selection (DAMAGED, SHORT, OVER, WRONG_PRODUCT, EXPIRED)
  - Notes textarea
  - Photo evidence upload area
  - Variance type badge display
- `src/features/quality/components/QcInspectionDetailDialog.tsx` — Read-only detail

**Verification:**
1. Inspection list shows all inspections with status badges
2. Open inspection → complete with pass results → status changes to PASSED
3. Open inspection → complete with fail results → status changes to FAILED
4. Verify photos can be added (placeholder/simulated if upload endpoint not ready)
5. Integration: Complete inspection from GRN flow (from I-06 / I-05)

**Backend Dependencies:** Check if existing endpoints suffice (`InboundWebController_inspectQc`, `InboundWebController_startInspection`, `InboundWebController_completeInspection`). **[GAP]** If quality list endpoint doesn't exist, create it.

---

### Prompt QI-02: Quality Dashboard

**Context:**  
A consolidated quality dashboard showing pending inspections, recent NCRs, and quality metrics. The reference project's `QualityControlPage.tsx` provides this.

**Prerequisites:** Prompt QI-01 (QC Inspection Workflow)

**Task:**  
Create `src/features/quality/pages/QualityDashboardPage.tsx`:
1. **Stats cards:** Pending Inspections, Completed Today, Pass Rate %, Open NCRs
2. **Pending Inspections table:** Quick-access list of inspections needing action
3. **Recent NCRs:** Last 5 NCRs with status and severity
4. **Quality Metrics:** Pass/fail ratio chart (can be simple bar chart using recharts)
5. **Quick actions:** "New Inspection" button (opens inspection dialog), "New NCR" button (opens NCR dialog — already exists)

**Files to Create:**
- `src/features/quality/pages/QualityDashboardPage.tsx`
- Route: Add `/inbound/quality` route if not already present

**Verification:**
1. Dashboard loads with real data from inspection and NCR APIs
2. Stats cards show correct counts
3. Clicking "New Inspection" opens inspection creation flow
4. Pending inspections list links to inspection detail

**Backend Dependencies:** Quality inspection list endpoint; NCR list endpoint (exists)

---

### Prompt QI-03: Cycle Count Execution UI (Backend + Frontend)

**Context:**  
Cycle counting is a critical inventory accuracy process. The current project has scheduling but no execution flow. The reference project's `CycleCountDashboard.tsx` provides count execution with variance entry.

---

#### Backend Part: Cycle Count Execution API

Existing endpoints that should work:
- `CountWebController_schedule` — Schedule a count
- `CountWebController_list` — List counts
- `CountWebController_summary` — Count summary
- `CountWebController_batchSubmitLines` — Submit count results
- `CountWebController_submitAdhoc` — Submit ad-hoc count

If any are missing, add them to the backend.

---

#### Frontend Part: Cycle Count Execution UI

**Files to Create (Frontend):**
- `src/features/cycle-counts/pages/CycleCountExecutionPage.tsx`:
  - List of assigned counts with status badges
  - Filter: status, assigned user, facility, count method (BLIND/DIRECTED)
  - "Start Count" action → opens count execution dialog
- `src/features/cycle-counts/components/CycleCountTaskDetail.tsx` — Count execution dialog:
  - Header: Count number, method, status, expected items count
  - Items table: Location, Product SKU, Product Name, Expected Qty, Counted Qty (editable), Variance (auto-calculated), Status
  - Counting instructions display
  - "Submit Line" button per item (or batch submit)
  - "Complete Count" button → calls `useCompleteCount()` or `batchSubmitLines`
  - Variance summary: items with discrepancies highlighted
- `src/features/cycle-counts/data/cycle-count-queries.ts` — Add/update hooks:
  - `useSubmitCountLine` (uses `CountWebController_batchSubmitLines`)
  - `useCountSummary` (uses `CountWebController_summary`)
  - `useCompleteCount` — if endpoint exists

**Verification:**
1. Schedule a count (existing functionality) → appears in execution list
2. "Start Count" → dialog opens with expected items
3. Enter counted quantities for each item → variance auto-calculates
4. Submit lines → data persists
5. Complete count → status changes to COMPLETED or VARIANCE (if discrepancies exist)

**Backend Dependencies:** Existing endpoints should cover this. Verify `CountWebController_batchSubmitLines` works for submitting individual count lines.

---

### Prompt QI-04: Holds Create/Release (Backend + Frontend)

**Context:**  
The current project can list inventory holds but cannot create or release them. This is a critical operational gap — warehouse operators need to place items on hold (quality issues, damage, disputes) and release them when resolved.

---

#### Backend Part: Holds API

**Files to Create (Backend):**
- Endpoints:
  - `POST /api/v1/wms/web/inventory/holds` — Create hold
  - `POST /api/v1/wms/web/inventory/holds/{id}/release` — Release hold
  - `GET /api/v1/wms/web/inventory/holds/{id}` — Get hold detail

**Hold fields:**
```
id: string
facilityId: string
productId: string
productName?: string
locationId: string
lotId?: string
quantity: number
holdType: string (e.g., QA, DAMAGE, CUSTOMER_HOLD, DISPUTE, OTHER)
reason: string
status: 'ACTIVE' | 'RELEASED'
createdAt: string
releasedAt?: string
releasedBy?: string
notes?: string
```

---

#### Frontend Part: Holds UI

**Files to Create (Frontend):**
- `src/features/inventory/holds/components/ApplyHoldDialog.tsx`:
  - Product (searchable `ProductSearchSelect`)
  - Location (searchable `LocationSelect`, optional)
  - Lot/Serial number (optional)
  - Quantity
  - Hold Type (select: QA Hold, Damage Hold, Customer Hold, Dispute, Other)
  - Reason (textarea)
  - Notes (optional)
- `src/features/inventory/holds/components/ReleaseHoldDialog.tsx`:
  - Hold summary card (product, quantity, hold type, reason, date)
  - Release notes (textarea)
  - Confirm button with `ConfirmDialog` for destructive action
- `src/features/inventory/holds/data/hold-queries.ts` — Add:
  - `useCreateHold()` mutation
  - `useReleaseHold()` mutation

**Files to Modify:**
- `src/features/inventory/holds/` — Add "Create Hold" button and "Release" action to existing list page

**Verification:**
1. Stock Levels page → click "Place Hold" on a product (or Holds page → "Create Hold")
2. Fill form → submit → hold appears in list with ACTIVE status
3. In stock level view, the product shows a hold indicator (badge/icon)
4. Click "Release" on the hold → confirm dialog → hold status changes to RELEASED
5. Verify allocated/pickable quantity reflects the hold (backend responsibility)

**Backend Dependencies:** **[GAP]** Hold create/release endpoints

---

### Prompt QI-05: LPN Inquiry Dashboard with Barcode Generation

**Context:**  
LPNs (License Plate Numbers) are central to warehouse inventory tracking. The current project has LPN CRUD but no inquiry dashboard or barcode generation. The reference project's `LpnInquiryDashboard.tsx` provides LPN search with contents view, movement history, and barcode generation (`LpnSingleBarcodeDialog.tsx` — Code128 on canvas).

**Task:**  
Create an LPN inquiry dashboard:

1. **LPN Search:** Search by LPN number (text input). On submit, call `useFindLpnByNumber()`.
2. **LPN Details Card:** LPN number, type (PALLET, CASE, EACH), status (badge), location, product, quantity, parent LPN (if nested), created date
3. **Contents Table:** If LPN has children (nested LPNs), show them in a tree/table
4. **Movement History Timeline:** Show recent moves (past 7 days): From Location → To Location, date, user
5. **Barcode Generation Button:** Opens `LpnBarcodeDialog.tsx` — generates Code128 barcode on HTML canvas using `JsBarcode` or similar library. Shows barcode image with LPN number text below. Buttons: Print, Download as PNG.

**Files to Create:**
- `src/features/lpns/pages/LpnInquiryDashboard.tsx`
- `src/features/lpns/components/LpnBarcodeDialog.tsx` — Barcode generation dialog
- `src/features/lpns/data/lpn-queries.ts` — Add `useLpnHierarchy` if not already present

**Verification:**
1. Enter LPN number → search → LPN detail displays
2. If LPN has children, show them nested
3. Barcode generation: opens dialog, shows valid Code128 barcode
4. Print button triggers browser print
5. Download button saves PNG
6. Movement history shows recent transactions

**Backend Dependencies:** LPN endpoints exist (`LpnWebController_findByNumber`). `LpnWebController_getHierarchy` exists in generated client.

---

### Prompt QI-06: Replenishment Feature (Backend + Frontend)

**Context:**  
Forward picking locations need to be replenished from bulk storage when stock drops below thresholds. The current project has no replenishment feature. The reference has replenishment routes.

---

#### Backend Part: Replenishment API

**Files to Create (Backend):**
- Endpoints:
  - `GET /api/v1/wms/web/replenishment/suggestions` — Get replenishment suggestions (products below min threshold)
  - `POST /api/v1/wms/web/replenishment/tasks` — Create replenishment task
  - `GET /api/v1/wms/web/replenishment/tasks` — List tasks
  - `POST /api/v1/wms/web/replenishment/tasks/{id}/complete` — Complete task

**ReplenishmentSuggestion fields:**
```
productId: string
productName: string
productSku: string
pickLocationId: string
pickLocationCode: string
currentQuantity: number
minQuantity: number
maxQuantity: number
suggestedQuantity: number
bulkLocationId: string
bulkLocationCode: string
```

---

#### Frontend Part: Replenishment UI

**Files to Create (Frontend):**
- `src/features/replenishment/pages/ReplenishmentPage.tsx`:
  - **Replenishment Suggestions tab:** Table of products needing replenishment with: Product, Pick Location, Current Qty, Min/Max, Suggested Qty, Bulk Location, "Create Task" action
  - **Active Tasks tab:** List of replenishment tasks with: Task ID, Product, From Location, To Location, Quantity, Status, Actions (Complete, Cancel)
  - **History tab:** Completed replenishment tasks
- `src/features/replenishment/data/replenishment-queries.ts` — Query hooks

**Verification:**
1. Replenishment suggestions show products below minimum threshold
2. Click "Create Task" → task appears in Active Tasks tab
3. Complete task → status changes to COMPLETED
4. Cancel task → status changes to CANCELLED

**Backend Dependencies:** **[GAP]** New replenishment endpoints

---

## Phase 4: Operations & Enterprise

---

### Prompt E-01: Warehouse Setup Wizard (Backend + Frontend)

**Context:**  
Setting up a new warehouse facility requires defining zones, aisles, bays, racks, and locations. The reference project's `WarehouseSetupWizard.tsx` (7-step) allows batch-generating the location hierarchy.

---

#### Backend Part: Batch Location Generation API

**Files to Create (Backend):**
- Endpoint: `POST /api/v1/wms/web/facilities/{id}/generate-locations` — Batch generate locations from configuration

**Request DTO:**
```typescript
interface GenerateLocationsDto {
  facilityId: string
  zones: {
    name: string
    code: string
    aisleCount: number
    aisles: {
      code: string
      bayCount: number
      bays: {
        code: string
        levelCount: number
        levels: {
          code: string
          locationsPerLevel: number
          locationPrefix: string
        }[]
      }[]
    }[]
  }[]
}
```

---

#### Frontend Part: Setup Wizard

**Files to Create (Frontend):**
- `src/features/warehouse/components/WarehouseSetupWizard.tsx` — Multi-step wizard:
  1. **Welcome:** Select facility, overview of what will be created
  2. **Zones:** Define zone names and codes (Receiving, Bulk Storage, Forward Pick, Quality, Shipping)
  3. **Aisles:** Per zone, define aisle count and naming pattern
  4. **Bays:** Per aisle, define bay count per aisle
  5. **Levels:** Per bay, define level count per bay
  6. **Locations:** Per level, define locations per level and naming pattern (e.g., `{ZONE}-{AISLE}-{BAY}-{LEVEL}-{LOC}`)
  7. **Review & Generate:** Summary of all settings, "Generate Locations" button

- `src/features/warehouse/components/ZoneConfigWizard.tsx` — Sub-wizard for zone configuration (can be reused)

**Verification:**
1. Open wizard from Warehouse → Setup
2. Complete all steps with a small config (2 zones, 1 aisle, 2 bays, 2 levels, 2 locations = 16 locations)
3. Click Generate → verify locations appear in the Locations list
4. Verify location codes follow the naming pattern

**Backend Dependencies:** **[GAP]** Batch location generation endpoint

---

### Prompt E-02: Aisle/Bay/Rack Management (Backend + Frontend)

**Context:**  
The current warehouse structure is flat (Facility → Zone → Location). Real warehouses need hierarchical management (Aisle → Bay → Rack → Level → Location).

---

#### Backend Part: Warehouse Hierarchy API

**Files to Create (Backend):**
- Controllers for Aisle, Bay, Rack, Level entities:
  - `GET /api/v1/wms/web/aisles` — List aisles (by zone)
  - `POST /api/v1/wms/web/aisles` — Create aisle
  - `PATCH /api/v1/wms/web/aisles/{id}` — Update
  - `DELETE /api/v1/wms/web/aisles/{id}` — Delete
  - Same pattern for bays, racks, levels

---

#### Frontend Part: Hierarchy UI

**Files to Create (Frontend):**
- `src/features/warehouse/pages/AisleManagementPage.tsx` — CRUD DataTable
- `src/features/warehouse/pages/BayManagementPage.tsx` — CRUD DataTable
- `src/features/warehouse/pages/RackManagementPage.tsx` — CRUD DataTable
- Each with: create dialog, edit dialog, delete with confirmation, status badges, filters

**Files to Modify:**
- `src/components/layout/data/sidebar-data.ts` — Add navigation items for Aisles, Bays, Racks under Warehouse section

**Verification:**
1. Create zones → aisles → bays → racks → levels via the management pages
2. Each entity appears in its parent's context (aisles filtered by zone)
3. Delete with cascade confirmation (e.g., deleting an aisle warns that bays and locations will be affected)

**Backend Dependencies:** **[GAP]** Aisle, Bay, Rack, Level entities and endpoints

---

### Prompt E-03: Role-Based Navigation

**Context:**  
The current sidebar shows the same navigation to all users. The reference project implements role-based filtering via `filterSidebarByRole()` — showing Tenant Admin, Warehouse Admin, and Warehouse User views.

**Task:**  
Implement role-based sidebar filtering:

1. **Define role groups:**
   - `TENANT_ADMIN`: User management, clients, vendors, facilities, billing, audit logs, integrations, settings
   - `WAREHOUSE_ADMIN`: All operations (inbound, outbound, inventory, quality, warehouse structure, reports, admin)
   - `WAREHOUSE_USER`: Simplified operational view (dashboard, assigned tasks, inventory lookup)

2. **Modify `sidebar-data.ts`:** Add `roles?: string[]` to each `NavItem` and `NavGroup`. Items without roles specified are visible to all.

3. **Create filter function:** `filterSidebarByRole(sidebarData, userRoles)` — filters nav groups and items based on user's roles

4. **Apply in layout:** In `AppSidebar`, call filter function with current user's roles before rendering

**Files to Modify:**
- `src/components/layout/data/sidebar-data.ts` — Add role annotations to nav items
- `src/components/layout/utils/filter-sidebar.ts` — New file, filter function
- `src/components/layout/app-sidebar.tsx` — Apply filter

**Verification:**
1. Log in as Tenant Admin → see only tenant admin items
2. Log in as Warehouse Admin → see all operational items
3. Log in as Warehouse User → see simplified view
4. Items without role restrictions are visible to all
5. Sidebar correctly hides/shows based on role changes

**Backend Dependencies:** User roles must be available in the auth context (they are, via SaaS Core API)

---

### Prompt E-04: Audit Logs Page

**Context:**  
Warehouse operations need complete audit trails. The reference project has `AuditLogsPage.tsx` under tenant admin.

**Task:**  
Create `src/features/admin/audit-logs/pages/AuditLogsPage.tsx`:
1. **DataTable** with: Timestamp, User, Action (CREATE, UPDATE, DELETE, STATUS_CHANGE), Entity Type (ASN, GRN, ORDER, etc.), Entity ID, Details, IP Address
2. **Filters:** Date range, User, Action type, Entity type
3. **Export:** Download logs as CSV
4. **Detail expand:** Click a row to see full audit entry details

**Files to Create:**
- `src/features/admin/audit-logs/data/audit-log-queries.ts` — `useAuditLogs(params?)` hook
- `src/features/admin/audit-logs/pages/AuditLogsPage.tsx`
- Route: Add `/admin/audit-logs` if not present

**Verification:**
1. Audit logs page loads with data
2. Filters work (date range, user, action type)
3. Click row → detail expands
4. Export downloads CSV

**Backend Dependencies:** SaaS Core API likely has audit log endpoints (`audit/` module). Check `src/lib/api/wms-saas-core-api/audit/`.

---

### Prompt E-05: Business Rules Configuration

**Context:**  
The generated client has `WmsRuleController` endpoints for managing business rules (putaway rules, allocation rules, etc.). The reference project has `BusinessRulesPage.tsx` for configuring these rules.

**Task:**  
Create `src/features/admin/rules/pages/BusinessRulesPage.tsx`:
1. **Rules list:** DataTable with: Rule Key, Name, Type (PUTAWAY, ALLOCATION, PICKING, etc.), Status (ACTIVE/INACTIVE), Version, Last Evaluated, Actions
2. **Rule detail dialog:** Shows rule configuration (JSON or structured), version history, evaluation results
3. **Rule create dialog:** Key, Name, Description, Type, Rule expression (JSON), Status toggle
4. **Rule evaluation:** "Test" button → calls `WmsRuleController_evaluate` with test data → shows pass/fail result
5. **Version management:** Show version history, "Rollback" button

**Files to Create:**
- `src/features/admin/rules/data/rule-queries.ts` — Hooks using generated `WmsRuleController_*` functions
- `src/features/admin/rules/pages/BusinessRulesPage.tsx`
- `src/features/admin/rules/components/RuleDialog.tsx`
- `src/features/admin/rules/components/RuleDetailDialog.tsx`
- Route: Add `/admin/rules` if not present

**Verification:**
1. Rules list loads from API
2. Create a new rule → appears in list
3. Test rule with sample data → evaluation result shows
4. Edit rule → changes persist
5. Version rollback → rule reverts to previous version

**Backend Dependencies:** `WmsRuleController_*` endpoints exist in generated client (list, create, get, update, evaluate, rollback). Verify they're functional.

---

### Prompt E-06: Dashboard Real Data Enhancement

**Context:**  
The current dashboard uses placeholder random data for charts and "Recent Sales" shows static users. The reference dashboard shows real KPI metrics.

**Task:**  
Replace placeholder dashboard data with real data from API:

1. **Charts:**
   - `Overview.tsx` — Bar chart showing orders per day/week/month. Replace random data with `useRecentOrders()` data grouped by date.
   - `AnalyticsChart.tsx` — Area chart showing inventory trends. Replace with `useStockLevels()` aggregated data.

2. **Recent Activity:**
   - Replace static "Recent Sales" with real recent orders table
   - Add recent adjustments section
   - Add low stock alerts widget (uses `useLowStockAlerts()`)

3. **KPI Cards:**
   - Uses real data from existing hooks (`useOpenOrdersCount`, `usePendingAllocationsCount`, etc.)
   - Already uses real data — these are working correctly

**Files to Modify:**
- `src/features/dashboard/components/overview.tsx` — Connect to real data
- `src/features/dashboard/components/analytics-chart.tsx` — Connect to real data
- `src/features/dashboard/components/recent-sales.tsx` — Replace with `useRecentOrders()`
- `src/features/dashboard/index.tsx` — May need additional sections

**Verification:**
1. Dashboard loads without errors
2. Charts show actual data from API (not random placeholders)
3. Recent activity shows real orders/adjustments
4. KPI cards show correct counts
5. All sections respond to facility selection changes

**Backend Dependencies:** Dashboard hooks already use real APIs — no new backend work needed

---

## Backend API Gap Summary

This table consolidates all backend endpoints that need to be created or verified:

| # | Endpoint | Purpose | Phase | Priority |
|---|----------|---------|-------|----------|
| B-01 | `GET/POST/PATCH/DELETE /api/v1/wms/web/asn-lines` | ASN Lines CRUD | I-02 | 🔴 Critical |
| B-02 | `GET /api/v1/wms/web/inbound/asn` | ASN list with pagination | I-01 | 🔴 Critical |
| B-03 | `GET/POST/PATCH/DELETE /api/v1/wms/web/grn-lines` | GRN Lines CRUD | I-05 | 🔴 Critical |
| B-04 | `GET /api/v1/wms/web/inbound/grn` | GRN list with pagination | I-05 | 🔴 Critical |
| B-05 | `GET/POST/PATCH/DELETE /api/v1/wms/web/order-lines` | Order Lines CRUD | O-01 | 🔴 Critical |
| B-06 | `POST /api/v1/wms/web/inventory/holds` | Create inventory hold | QI-04 | 🔴 Critical |
| B-07 | `POST /api/v1/wms/web/inventory/holds/{id}/release` | Release inventory hold | QI-04 | 🔴 Critical |
| B-08 | `GET/POST/PATCH/DELETE /api/v1/wms/web/cycle-count-lines` | Cycle count line CRUD (if not via batchSubmit) | QI-03 | 🟡 High |
| B-09 | `GET/POST/PATCH/DELETE /api/v1/wms/web/transfer-lines` | Transfer line items | F-04 | 🟡 High |
| B-10 | `POST /api/v1/wms/web/transfers/{id}/receive` | Receive transfer | F-04 | 🟡 High |
| B-11 | `GET/POST/PATCH/DELETE /api/v1/wms/web/categories` | Product categories | F-04 | 🟡 High |
| B-12 | `GET/POST/PATCH/DELETE /api/v1/wms/web/aisles` | Aisle management | E-02 | 🟡 High |
| B-13 | `GET/POST/PATCH/DELETE /api/v1/wms/web/bays` | Bay management | E-02 | 🟡 High |
| B-14 | `GET/POST/PATCH/DELETE /api/v1/wms/web/racks` | Rack/level management | E-02 | 🟡 High |
| B-15 | `POST /api/v1/wms/web/facilities/{id}/generate-locations` | Batch location generation | E-01 | 🟡 High |
| B-16 | `GET/POST /api/v1/wms/web/quality/inspections` | Quality inspection list/create | QI-01 | 🟡 High |
| B-17 | `GET/POST/PATCH/DELETE /api/v1/wms/web/replenishment/suggestions` | Replenishment | QI-06 | 🟡 Medium |
| B-18 | `POST /api/v1/wms/web/waves/{id}/generate-pick-tasks` | Pick task generation from wave | O-05 | 🟡 Medium |

**Note:** Some of these may already exist in the backend. Verify against the actual running backend before implementing. The generated client may not perfectly match the deployed backend version.

---

## Verification Runbook

After implementing each prompt, run these checks:

### Code Quality
```bash
npx tsc -b --noEmit          # TypeScript compilation
npm run lint                  # ESLint
npm run format:check          # Prettier
```

### Manual Verification (per prompt)
1. **DataTable pages:** Sort asc/desc, filter, paginate, search — all work
2. **Dialogs:** Open, close, submit, cancel — all work. Validation messages show
3. **Wizards:** Step forward/backward, validation on each step, final submit — all work
4. **Mutations:** Success shows toast, failure shows error toast, cache invalidates on success
5. **Mobile:** Pages are usable at 768px width (sidebar collapses, tables scroll horizontally)
6. **Dark mode:** All new components respect the current theme

### Integration Checks
1. Inbound flow: Create ASN with lines → Mark Arrived → Start Receiving → Complete Receiving → QC Inspection → Putaway
2. Outbound flow: Create Order with lines → Allocate → Assign to Wave → Generate Pick Tasks
3. Inventory flow: Schedule Cycle Count → Execute Count → Submit Lines → Complete Count → Check Variance

---

*End of document*
