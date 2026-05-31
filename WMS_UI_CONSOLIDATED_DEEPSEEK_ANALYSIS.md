# WMS UI — Comprehensive Gap Analysis & Implementation Plan

> **Prepared by:** Codebase Analysis Agent  
> **Wearing two hats:** WMS Domain Expert + UX Designer  
> **Reference:** `reference-wms-ui-frontend` (LightCrate WMS)  
> **Target:** `nest-wms-ui`  
> **Date:** 2026-05-31

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Domain-by-Domain Comparison](#2-domain-by-domain-comparison)
   - 2.1 Inbound Domain
   - 2.2 Outbound Domain
   - 2.3 Inventory Domain
   - 2.4 Quality Domain
   - 2.5 Warehouse Structure Domain
   - 2.6 Master Data Domain
   - 2.7 Admin & Configuration
   - 2.8 Dashboard & Reporting
   - 2.9 Cross-Cutting Concerns (RF/Mobile, Billing, Labor, Yard)
3. [UI/UX Design Gaps](#3-uiux-design-gaps)
4. [Process & Workflow Gaps](#4-process--workflow-gaps)
5. [Architectural & Code Gaps](#5-architectural--code-gaps)
6. [Implementation Plan](#6-implementation-plan)
   - 6.1 Phased Roadmap
   - 6.2 Phase Details
7. [Appendix: Reference Best Practices to Adopt](#7-appendix-reference-best-practices-to-adopt)

---

## 1. Executive Summary

The `nest-wms-ui` project has **32 feature directories** and a solid architecture (TanStack Router, TanStack Query, Zustand, shadcn/ui, auto-generated API clients). However, several **critical warehouse domain concepts are missing or incomplete**, and the **UI/UX does not meet enterprise WMS standards**.

The `reference-wms-ui-frontend` (LightCrate WMS) demonstrates best practices including:
- **Header + Line Items pattern** for all transactional entities (ASN, Sales Orders, GRN)
- **Multi-step wizards** for complex creation flows
- **Status badge system** with lifecycle-aware color coding
- **Filter chips, faceted filters, server-side pagination**
- **Barcode generation and scanning**
- **Process-aware action mapping** (which actions are allowed per status)
- **Kanban boards and wave visualization** for operational views
- **Dedicated detail/dialog components** with read-only mode

**Core thesis:** The current project has the right structural foundation but lacks deep warehouse process modeling. The reference project is design-savvy and process-complete but has shallow API integration. A synthesis of both is the ideal path forward.

---

## 2. Domain-by-Domain Comparison

### 2.1 Inbound Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **ASN Header** | Create dialog with vendor, PO, carrier, dates | Full ASN page with list, create/edit wizard, details dialog, receiving dialog | 🟡 Present but minimal. No list view, no detail view |
| **ASN Lines** | ❌ **Not present** | `AsnLineItemsDialog.tsx` — CRUD with product search, UOM, quantity, lot/expiry | 🔴 **Critical gap** — ASN without lines is non-functional |
| **ASN + GRN Creation** | Separate: Create ASN → Create GRN from ASN | `AsnCreateWizard.tsx` — 3-step wizard (Basic → Line Items → Review) creates ASN + lines + auto-generates GRN | 🔴 **Critical gap** — No unified creation flow |
| **ASN Status Lifecycle** | 5 statuses (draft, sent, in_transit, received, cancelled) | 8 statuses (CREATED → IN_TRANSIT → ARRIVED → IN_RECEIVING → PARTIALLY_RECEIVED → RECEIVED → CLOSED → CANCELLED) with transition validation | 🟡 Statuses are simpler; no transition validation |
| **GRN Lines** | ❌ **Not present** | `GrnLineItemsDialog.tsx` — Lines with variance calculation, LPN barcodes, UOM | 🔴 **Critical gap** — GRN must track individual line receipts |
| **GRN Status Transitions** | 6 action buttons (Arrived → Receiving → Received → Inspection → Complete) | Follows GRN line lifecycle (OPEN → RECEIVED → INSPECTING → INSPECTED → PUTAWAY_PENDING → PUTAWAY_DONE → CANCELLED) | 🟡 Current actions are reasonable but lack state machine enforcement |
| **Putaway Board** | Kanban-style board with status grouping, filters | Part of inbound flow; integrated with GRN completion | 🟢 Functional but no task execution UI |
| **Receiving Flow** | Manual ID entry, raw JSON progress | `AsnReceivingDialog.tsx` — Real-time GRN status tracking with progress bar (0%→33%→66%→100%), polling every 2s | 🟡 Functional but lacks real-time UX polish |
| **Cross-Docking** | ❌ **Not present** | `CrossDockManagementPage.tsx` | 🔴 Missing feature |
| **Appointments** | ❌ **Not present** | Route exists for appointments | 🔴 Missing feature |

**Reference patterns to adopt:**
- `AsnCreateWizard.tsx` — 3-step wizard for ASN+Lines+GRN creation
- `AsnLineItemsDialog.tsx` — Line items CRUD with product search
- `AsnReceivingDialog.tsx` — Real-time progress with polling
- `status-badges/AsnStatusBadge` — Badge system for ASN lifecycle
- `status-badges/GrnLineStatusBadge` — GRN line lifecycle badges
- `status-badges/AsnLineStatusBadge` — ASN line status badges

**Action items for inbound:**
1. Add ASN Lines entity (type, DTO, API hooks)
2. Add ASN list query (or expose API endpoint)
3. Build 3-step ASN Creation Wizard
4. Build ASN Detail dialog with line items
5. Add GRN Lines CRUD
6. Build receiving flow with real-time progress
7. Add cross-docking feature
8. Add appointment scheduling

---

### 2.2 Outbound Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **Sales Orders / Orders** | List with filters, create dialog (header only) | `SalesOrdersPage.tsx` + `SalesOrderCreateWizard.tsx` — 3-step wizard with line items | 🟡 Present but no line items |
| **Order Lines** | ❌ **Not present** | `LineItemsStep.tsx` — Product search, quantity, unit price, UOM | 🔴 **Critical gap** |
| **Order Detail/Edit** | ❌ **Not present** | `SalesOrderDetailsDialog.tsx` with line items, `SalesOrderDialog.tsx` for edit | 🔴 Missing |
| **Allocations** | List with override action | Part of order workflow | 🟢 Functional |
| **Picking Waves** | Wave board with kanban + table | `WaveManagementPage.tsx` + `WaveVisualizationMap.tsx` | 🟡 Present but limited |
| **Pick Task Generation** | ❌ **Not present** | `GeneratePickTasksDialog.tsx`, `PickListGenerationPage.tsx`, `CreatePickTaskDialog.tsx`, `WaveOptimizationPanel.tsx` | 🔴 **Critical gap** |
| **Picking Execution** | ❌ **Not present** | `PickingTaskScreen.tsx` — Full picking UI with location guidance, short-pick dialog, barcode validation | 🔴 **Critical gap** — No RF/mobile picking |
| **Packing** | ❌ **Not present** (packing-stations is config only) | `PackingPage.tsx` under `warehouse-user` — Packing execution with cartonization | 🔴 Missing |
| **Shipping & Manifest** | Shipment list (empty), manifest generation | `ShippingPage.tsx`, `ShippingLabelWizard.tsx` (4-step wizard), `ManifestCloseDialog.tsx`, `RateShoppingTab.tsx`, `TrackingStatusWidget.tsx` | 🟡 Present but mostly placeholder |
| **Load Planning** | Load CRUD (container level) | `LoadPlanningPage.tsx`, `CreateLoadPlanDialog.tsx` | 🟢 Functional |
| **VAS Execution** | CRUD with events | `VASOperationsPage.tsx`, `VasExecutionQueue.tsx`, `VasTaskDetailDrawer.tsx` | 🟢 Functional but lacks execution queue |
| **Rate Shopping** | Carrier rates CRUD, compare, quote | `CarrierRateShoppingPage.tsx` with interactive comparison | 🟡 Present |

**Reference patterns to adopt:**
- `SalesOrderCreateWizard.tsx` — 3-step wizard with line items
- `PickingTaskScreen.tsx` — Picking execution UI with barcode scan
- `ShortPickDialog.tsx` — Exception handling during picking
- `WaveOptimizationPanel.tsx` — Wave management
- `ShippingLabelWizard.tsx` — 4-step label wizard

**Action items for outbound:**
1. Add Order Lines CRUD
2. Build Sales Order Creation Wizard
3. Add Order Detail/Edit dialog
4. Build pick task generation from waves
5. Build picking execution UI (mobile + desktop)
6. Build packing execution UI
7. Expand shipping with wizard, manifest close, rate shopping
8. Add VAS execution queue with status tracking
9. Integrate label printing

---

### 2.3 Inventory Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **Stock Levels** | List with filters, pagination | `InventoryQuickLookupWidget.tsx` — Barcode/SKU search | 🟢 Functional |
| **Low Stock Alerts** | List with threshold filter | Part of dashboard | 🟢 Functional |
| **Adjustments** | CRUD with submit/approve workflow | `AdjustStockDialog.tsx` — Simple add/remove/set | 🟢 More workflow stages |
| **Holds** | List (no create/release) | `ApplyHoldDialog.tsx`, `ActiveHoldsDashboard.tsx`, `InventoryHoldIndicator.tsx` | 🟡 Missing mutation hooks |
| **Inventory Transactions** | ❌ Placeholder (empty API) | Movement history timeline in LPN inquiry | 🔴 No API/UI |
| **Cycle Counts** | List + schedule | `CycleCountDashboard.tsx` — Task details, variance summary, expected items table | 🟡 Missing execution UI |
| **LPN Management** | Full CRUD with move/nest/unnest | `LpnInquiryDashboard.tsx`, `LpnBarcodeDialog.tsx` — Barcode generation (Code128), inquiry with movement history | 🟡 Missing barcode generation and inquiry dashboard |
| **Inventory Reservations** | Full CRUD | Not in reference | 🟢 Well implemented |
| **Replenishment** | ❌ **Not present** | Route exists but no feature directory | 🔴 Missing feature |

**Reference patterns to adopt:**
- `InventoryHoldIndicator.tsx` — Hold display on inventory cards
- `LpnSingleBarcodeDialog.tsx` — Code128 barcode generation on canvas
- `CycleCountDashboard.tsx` — Count execution with variance
- `LpnInquiryDashboard.tsx` — LPN search with movement history

**Action items for inventory:**
1. Add holds create/release mutations
2. Build cycle count execution UI
3. Add LPN barcode generation + inquiry dashboard
4. Add inventory transactions UI (when API is ready)
5. Build replenishment feature
6. Add inventory velocity/trend charts

---

### 2.4 Quality Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **QC Inspections** | ❌ **Not present** as feature | `QualityInspectionWorkflow.tsx` — Full form with checklist, pass/fail, defect codes, photo evidence | 🔴 **Critical gap** |
| **NCR (Non-Conformance)** | CRUD with filters | `NCRPage.tsx`, `NCRDialog.tsx` | 🟢 Functional |
| **Quality Control Page** | ❌ **Not present** | `QualityControlPage.tsx` — Overview dashboard | 🔴 Missing |

**Reference patterns to adopt:**
- `QualityInspectionWorkflow.tsx` — Inspection form with checklist, photos, defect codes
- `QcInspectionDialog.tsx` — QC dialog with variance types, photo capture
- `status-badges/QcStatusBadge` — QC status badges

**Action items for quality:**
1. Build QC inspection workflow page
2. Build quality control dashboard
3. Add photo evidence capture in inspections
4. Add QC status badges

---

### 2.5 Warehouse Structure Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **Facilities** | CRUD | CRUD (via tenant admin) | 🟢 Functional |
| **Zones** | CRUD | CRUD with `ZoneConfigWizard.tsx` | 🟡 Missing zone setup wizard |
| **Locations** | CRUD (no delete) | CRUD with `LocationFormDialog.tsx` | 🟢 Functional |
| **Aisles / Bays** | ❌ **Not present** | `AisleManagementPage.tsx`, `BayManagementPage.tsx` | 🔴 Missing |
| **Docks / Doors** | Loading docks CRUD | `DockManagementPage.tsx`, `DockFormDialog.tsx` | 🟢 Functional |
| **Equipment** | ❌ **Not present** | `EquipmentTrackingPage.tsx` | 🔴 Missing |
| **Yard Vehicles** | ❌ **Not present** | Yard vehicle routes exist | 🔴 Missing |
| **Slotting** | ❌ **Not present** | `SlottingOptimizationPage.tsx` | 🔴 Missing |

**Action items:**
1. Add aisles/bays CRUD
2. Add equipment tracking
3. Add yard management
4. Add slotting/optimization
5. Build zone configuration wizard

---

### 2.6 Master Data Domain

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **Products** | CRUD with create/edit detail pages | CRUD via `product-categories` | 🟢 Well implemented |
| **Categories** | Page only, no data layer | Part of products | 🟡 Missing data layer |
| **Brands** | CRUD | Not present | 🟢 Well implemented |
| **Product Packaging** | CRUD | Not present | 🟢 Well implemented |
| **Product Suppliers** | CRUD | Not present | 🟢 Well implemented |
| **Product-Client Assignments** | CRUD | Not present | 🟢 Well implemented |
| **Clients** | Full CRUD with contacts/addresses | CRUD (tenant admin) | 🟢 Well implemented |
| **Vendors** | Full CRUD with contacts/addresses | CRUD (tenant admin) | 🟢 Well implemented |
| **Carriers** | Full CRUD | CRUD (warehouse admin config) | 🟢 Well implemented |
| **LPNs** | Full CRUD | Inquiry-focused | 🟢 Well implemented |
| **UOM Management** | ❌ **Not present** | `UnitOfMeasureManagementPage.tsx` | 🔴 Missing |

**Action items:**
1. Add categories data layer
2. Add UOM management

---

### 2.7 Admin & Configuration

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **User Management** | CRUD via SaaS Core API | CRUD (tenant admin) | 🟢 Functional |
| **Role Management** | Assign role | Full role/permission system | 🟡 Basic |
| **Settings** | Profile, account, appearance, notifications, display | Settings page | 🟢 Functional |
| **Audit Logs** | ❌ **Not present** | `AuditLogsPage.tsx` | 🔴 Missing |
| **Business Rules** | ❌ **Not present** | `BusinessRulesPage.tsx`, `AddBusinessRuleDialog.tsx` | 🔴 Missing |
| **Integrations** | ❌ **Not present** | `IntegrationsPage.tsx` | 🔴 Missing |
| **Notification Management** | Notification logs | Notifications management (tenant admin) | 🟡 Partial |

**Action items:**
1. Add audit logs page
2. Add business rules UI
3. Add integrations management

---

### 2.8 Dashboard & Reporting

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **Dashboard** | KPI cards (6 metrics) + Recent Orders + Recent Adjustments | Tabbed dashboard (Overview/Analytics) with revenue KPIs, charts, billing metrics | 🟡 Current dashboard shows real data but is simpler |
| **Charts** | Placeholder random data in recharts | Recharts with real data | 🟡 Charts are placeholders |
| **Reports** | Async report generation with polling | Reports page (tenant admin) | 🟢 Functional |
| **KPIs** | Hardcoded metrics | `MyKpisPage.tsx` — Configurable KPI views | 🟡 No configurable KPIs |
| **Analytics** | Placeholder analytics page | `advanced-analytics.tsx`, `analytics.tsx` routes exist | 🟡 Placeholder |

**Action items:**
1. Replace placeholder chart data with real queries
2. Add configurable KPI widgets
3. Add analytics dashboard with trends

---

### 2.9 Cross-Cutting Concerns

| Domain | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Gap Assessment |
|--------|------------------------|------------------------------|----------------|
| **RF/Mobile Operations** | ❌ **Not present** (API has wms-rf/, rf/, scanner/ but no UI) | `RFPackingSessionPage.tsx`, `ScanStationPage.tsx`, `TaskListPage.tsx`, `MessagesPage.tsx` — Mobile-first RF views | 🔴 **Critical gap** |
| **3PL Billing** | ❌ **Not present** | `BillingDashboard.tsx`, `BillingRunWizard.tsx`, `ChargeReviewTable.tsx`, `StorageFeesWidget.tsx` | 🔴 Missing |
| **Labor Management** | ❌ **Not present** | `LaborManagementPage.tsx`, `LaborDialog.tsx` — Time tracking, labor assignment | 🔴 Missing |
| **Yard Management** | ❌ **Not present** | Yard routes, equipment tracking | 🔴 Missing |
| **Returns** | Customer returns CRUD with return items | `ReturnsValidationWidget.tsx`, `RMAManagementPage.tsx` | 🟡 Functional but simpler |
| **Kitting** | ❌ **Not present** | `KittingOperationsPage.tsx` | 🔴 Missing |
| **Hazmat** | ❌ **Not present** | `HazmatManagementPage.tsx` | 🔴 Missing |
| **Exception Management** | CRUD with filters | `ExceptionManagementPage.tsx` | 🟢 Functional |

---

## 3. UI/UX Design Gaps

| Pattern | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Priority |
|---------|------------------------|------------------------------|----------|
| **Stepper/Wizard** | ❌ **None** | Multiple wizards: ASN Create (3-step), Sales Order Create (3-step), Shipping Label (4-step), Billing Run, Warehouse Setup | 🔴 **Critical** |
| **Status Badge System** | ❌ Inline ad-hoc styling per page | Centralized `status-badges/` with 8 badge components mapping status enums to `{ variant, label, className }` | 🔴 **Critical** |
| **Filter Chips** | ❌ **None** | `filter-chips.tsx` — Active filter display with remove buttons | 🟡 High |
| **Faceted Filters** | `DataTableFacetedFilter` exists but unused | Used in `DataTableToolbar` with multi-select checkboxes and count badges | 🟡 High |
| **Dialog Patterns** | Simple open/close | Consistent `DialogHeader → Content → Footer` pattern with `readOnly` prop for view mode | 🟡 Medium |
| **Detail Views** | ❌ None (except Products) | `AsnDetailsDialog.tsx`, `SalesOrderDetailsDialog.tsx` — Dedicated detail dialogs with read-only mode | 🔴 High |
| **Barcode Generation** | ❌ **None** | `LpnSingleBarcodeDialog.tsx` — Code128 on canvas with print/download | 🔴 High |
| **Barcode Scanner** | ❌ **None** | `barcode-lookup-widget.tsx`, `picking-task-scanner.tsx` | 🔴 High |
| **Process Flow Visualization** | Static numbered cards | Integrated into operational pages | 🟡 Medium |
| **Kanban/Board Views** | Putaway board only | Wave board, task board | 🟡 Medium |
| **Drawer/Sheet for Details** | ❌ **None** | `VasTaskDetailDrawer.tsx` | 🟡 Medium |
| **Command Menu (Cmd+K)** | Present | Present | 🟢 Present |
| **Config Drawer** | Present | Present | 🟢 Present |
| **Audit Metadata Display** | ❌ **None** | `AuditMetadata.tsx` — created/updated by with tooltips | 🟡 Medium |
| **Pagination** | Custom per-page | Reusable `DataTablePagination` with responsive design | 🟡 Medium |
| **Search** | Basic input | Column search + global search | 🟡 Medium |
| **Bulk Actions** | `DataTableBulkActions` exists but unused | Used across features | 🟡 Medium |
| **Date Picker** | Available but not used in most forms | Used consistently | 🟡 Medium |
| **Loading States** | Skeleton + spinner | Skeleton + spinner | 🟢 Present |
| **Empty States** | Basic "no data" | Better empty states | 🟡 Medium |
| **Error States** | Error with retry | Error with retry | 🟢 Present |
| **Responsive Design** | Basic | Better responsive with container queries | 🟡 Medium |
| **Theme (Dark/Light)** | Present | Present | 🟢 Present |

---

## 4. Process & Workflow Gaps

These are the **most impactful gaps** from a warehouse operations perspective:

### 4.1 ASN → Receiving → Putaway (Inbound Flow)
**Current:** ASN creation (header only) → Manual GRN creation → Status transitions → Putaway assignment
**Reference:** ASN creation wizard (header + lines) → Auto-GRN generation → Real-time receiving progress → QC inspection → Putaway
**Gap:** No line-level tracking, no unified wizard, no real-time receiving UX

### 4.2 Order → Allocation → Picking → Packing → Shipping (Outbound Flow)
**Current:** Order creation (header only) → Allocation override → Wave creation → No picking UI → No packing UI → Shipment manifest
**Reference:** Sales Order wizard (header + lines) → Auto-allocation → Wave optimization → Pick task generation → Mobile picking execution (with barcode, short-pick handling) → Packing (cartonization, label generation) → Shipping (rate shopping, manifest close, tracking)
**Gap:** Complete outbound execution pipeline is missing — this is the core WMS value proposition

### 4.3 Quality Management
**Current:** NCR only
**Reference:** QC inspection checklist → Defect code capture → Photo evidence → Pass/Fail disposition → NCR generation → Quality dashboard
**Gap:** No quality inspection workflow tied to receiving

### 4.4 Inventory Management
**Current:** Stock view, adjustments, holds (list only), cycle counts (list + schedule)
**Reference:** LPN inquiry with movement history, cycle count execution with variance, inventory holds with severity, replenishment
**Gap:** No cycle count execution, no replenishment, no inventory transactions timeline

### 4.5 Multi-step Creation Flows
**Current:** Single-step dialogs for all entities
**Reference:** Multi-step wizards for ASN, Sales Orders, Shipping Labels, Billing Runs, Warehouse Setup
**Gap:** Complex transactional entities need guided creation flows

---

## 5. Architectural & Code Gaps

| Aspect | Current (`nest-wms-ui`) | Reference (`lightcrate-wms`) | Recommendation |
|--------|------------------------|------------------------------|----------------|
| **API Client Generation** | Auto-generated from OpenAPI (`@nest` packages) | Orval-generated from OpenAPI | ✅ Current is fine |
| **Data Layer Pattern** | Feature-agnostic `data/*-queries.ts` files | Feature-embedded API calls in page components | ✅ Current is better — keep separate query files |
| **State Management** | Zustand (auth) + TanStack Query | Zustand (auth) + TanStack Query | ✅ Same pattern |
| **Component Reuse** | 24 common form fields, DataTable unused | DataTable used everywhere, dialog library | 🟡 Use DataTable across all pages, create dialog library |
| **Type Definitions** | Generated API types | Manual domain types | 🟡 Prefer generated types, supplement with domain enums |
| **Validators** | Zod (react-hook-form) | Custom validators (`validateRequired`, `validatePositiveNumber`) | ✅ Zod is superior |
| **Route Protection** | `ProtectedRoute` component | Role-based `ProtectedRoute` with `Role` enum | 🟡 Add role-based access |
| **Filter Pattern** | Per-page ad-hoc filters | Filter chips + faceted filters | 🟡 Standardize on DataTable + filter chips |
| **Testing** | Vitest + Playwright (tests exist) | Cypress | ✅ Current is fine |

---

## 6. Implementation Plan

### 6.1 Phased Roadmap Overview

```
Phase 1 (Foundation)     → Weeks 1-3: Core patterns + DataTable standardization + Status badges
Phase 2 (Inbound MVP)    → Weeks 4-6: ASN with lines wizard + GRN lines + Receiving flow
Phase 3 (Outbound MVP)   → Weeks 7-9: Orders with lines + Picking + Packing + Shipping
Phase 4 (Quality + Inventory) → Weeks 10-12: QC workflow + Cycle count execution + Holds/LPN enhancements
Phase 5 (Operations)     → Weeks 13-15: Wave optimization + Billing + Labor + Reports
Phase 6 (Advanced)       → Weeks 16-20: RF/Mobile + Yard + Cross-dock + Slotting
```

### 6.2 Phase Details

#### Phase 1: Foundation (Weeks 1-3)

**Objective:** Establish design patterns that all subsequent phases will follow.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 1.1 | Create centralized status badge system | `status-badges/StatusBadges.tsx` — Map each status enum to `{ variant, label, className }` | `AsnStatusBadge`, `GrnLineStatusBadge`, `AsnLineStatusBadge`, `QcStatusBadge`, `PickingTaskStatusBadge`, `CycleCountStatusBadge` |
| 1.2 | Standardize DataTable across all existing pages | Replace raw `<Table>` with `DataTable` component across 15+ pages | `DataTableToolbar`, `DataTablePagination`, `DataTableColumnHeader`, `DataTableBulkActions` |
| 1.3 | Add filter chips component | `FilterChips.tsx` — Active filter display with removable chips | `filter-chips.tsx` |
| 1.4 | Build reusable Wizard/Stepper component | Generic `<Stepper steps={[]} currentStep={n} />` + `<WizardDialog>` wrapper | `SalesOrderCreateWizard.tsx` stepper UI |
| 1.5 | Build shared dialog library | `DetailDialog`, `EditDialog`, `CreateDialog` with `readOnly` prop | `AsnDetailsDialog.tsx`, `SalesOrderDialog.tsx` |
| 1.6 | Add audit metadata component | `AuditMetadata.tsx` for created/updated by, timestamps | `AuditMetadata.tsx` |
| 1.7 | Add status transition validation | Define valid transitions for each status lifecycle | `VALID_ASN_STATUS_TRANSITIONS`, `VALID_GRN_LINE_STATUS_TRANSITIONS` |
| 1.8 | Remove/Clean placeholder queries | Fix `useShipments`, `useInventoryTransactions`, `usePolicies` returning empty | N/A |

**Files modified:** ~20-25 files (components + data-layer fixes)

---

#### Phase 2: Inbound MVP (Weeks 4-6)

**Objective:** Full inbound flow — ASN header + lines + GRN + receiving + putaway.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 2.1 | Add ASN Line entity types + API hooks | `AsnLine` interface, `useAsnLines`, `useCreateAsnLine`, `useDeleteAsnLine` | `AsnLineStatus`, `AsnLineItemsDialog.tsx` |
| 2.2 | Add ASN list query | `useAsns` with pagination, filters | `useGetAllAdvanceShippingNotices()` |
| 2.3 | Build ASN list page with DataTable | Replace placeholder with full list + filters + actions | `AsnPage.tsx` — Stats cards, filter bar, action dropdown |
| 2.4 | Build ASN Creation Wizard (3-step) | Step 1: Basic Info → Step 2: Line Items → Step 3: Review | `AsnCreateWizard.tsx` |
| 2.5 | Build ASN Detail Dialog | Header info + shipping + line items table with barcodes | `AsnDetailsDialog.tsx` |
| 2.6 | Build ASN Line Items Dialog | Manage lines on existing ASN | `AsnLineItemsDialog.tsx` |
| 2.7 | Build Receiving Dialog | Real-time progress with polling | `AsnReceivingDialog.tsx` |
| 2.8 | Add GRN Line Items CRUD | Lines with variance calculation | `GrnLineItemsDialog.tsx` |
| 2.9 | Build Putaway Task Execution UI | Task list → assign → execute → complete | Reference putaway flow |
| 2.10 | Add Cross-Docking feature | Cross-dock management page | `CrossDockManagementPage.tsx` |

**New files:** ~15 files  
**Modified files:** ~10 files

---

#### Phase 3: Outbound MVP (Weeks 7-9)

**Objective:** Full outbound flow — Orders with lines → Allocation → Picking → Packing → Shipping.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 3.1 | Add Order Line entity types + API hooks | `OrderLine` interface, `useOrderLines`, `useCreateOrderLine` | `LineItemsStep.tsx` |
| 3.2 | Build Sales Order Creation Wizard (3-step) | Step 1: Basic Info → Step 2: Line Items → Step 3: Review | `SalesOrderCreateWizard.tsx` |
| 3.3 | Build Order Detail Dialog | Header + line items + allocation status | `SalesOrderDetailsDialog.tsx` |
| 3.4 | Build Allocation Enhancement | Auto-allocation suggestion UI | Reference allocation flow |
| 3.5 | Build Wave Management with Optimization | Wave board + wave optimization panel + wave visualization | `WaveOptimizationPanel.tsx`, `WaveVisualizationMap.tsx` |
| 3.6 | Build Pick Task Generation | Generate pick tasks from waves, create pick lists | `GeneratePickTasksDialog.tsx`, `PickListGenerationPage.tsx` |
| 3.7 | Build Picking Execution UI | Picking screen with location guidance, barcode scan, short-pick handling | `PickingTaskScreen.tsx`, `ShortPickDialog.tsx`, `LocationGuidanceCard.tsx` |
| 3.8 | Build Packing Execution UI | Pack station view, cartonization, label generation | `PackingPage.tsx` |
| 3.9 | Build Shipping Label Wizard | 4-step label creation wizard | `ShippingLabelWizard.tsx` |
| 3.10 | Build Manifest Close dialog | Close shipments, generate manifests | `ManifestCloseDialog.tsx` |
| 3.11 | Rate Shopping enhancement | Carrier rate comparison with interactive UI | `RateShoppingTab.tsx`, `TrackingStatusWidget.tsx` |

**New files:** ~20 files  
**Modified files:** ~8 files

---

#### Phase 4: Quality + Inventory (Weeks 10-12)

**Objective:** Quality inspection workflows + inventory operations.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 4.1 | Build QC Inspection Workflow | Inspection form with checklist, pass/fail, defect codes, photo evidence | `QualityInspectionWorkflow.tsx`, `QcInspectionDialog.tsx` |
| 4.2 | Build Quality Dashboard | Quality metrics, pending inspections, NCR overview | `QualityControlPage.tsx` |
| 4.3 | Add NCR enhancement | Attach photos, link to inspections | `NCRDialog.tsx` |
| 4.4 | Build Cycle Count Execution UI | Count task detail, expected items, variance entry | `CycleCountDashboard.tsx` |
| 4.5 | Add Holds Create/Release | `ApplyHoldDialog.tsx`, `ReleaseHoldDialog.tsx` | `ApplyHoldDialog.tsx`, `ActiveHoldsDashboard.tsx` |
| 4.6 | Build LPN Inquiry Dashboard | LPN search, contents, movement history, barcode generation | `LpnInquiryDashboard.tsx`, `LpnSingleBarcodeDialog.tsx` |
| 4.7 | Add Inventory Holds Indicator | Show holds on stock level views | `InventoryHoldIndicator.tsx` |
| 4.8 | Build Replenishment Feature | Replenishment suggestions, task creation | New |

**New files:** ~15 files  
**Modified files:** ~10 files

---

#### Phase 5: Operations (Weeks 13-15)

**Objective:** Operational features — billing, labor, yard, advanced reporting.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 5.1 | Build Billing Dashboard | Charge review, storage fees, billing run wizard | `BillingDashboard.tsx`, `BillingRunWizard.tsx` |
| 5.2 | Build Labor Management | Time tracking, labor assignment, productivity metrics | `LaborManagementPage.tsx`, `LaborDialog.tsx` |
| 5.3 | Build Exception Management Enhancement | Trigger-based exception handling UI | `ExceptionManagementPage.tsx` |
| 5.4 | Build Yard Management | Dock scheduling, yard vehicle tracking | New |
| 5.5 | Build Equipment Tracking | Equipment status, assignment | `EquipmentTrackingPage.tsx` |
| 5.6 | Enhanced Reporting | Custom report builder, KPI dashboards | `MyKpisPage.tsx` |
| 5.7 | Add Audit Logs | System audit trail viewer | `AuditLogsPage.tsx` |
| 5.8 | Add Business Rules Config | Rule creation, activation UI | `BusinessRulesPage.tsx` |
| 5.9 | Kitting Operations | Kit assembly, disassembly | `KittingOperationsPage.tsx` |
| 5.10 | Hazmat Management | Hazardous material tracking | `HazmatManagementPage.tsx` |

**New files:** ~15 files  
**Modified files:** ~5 files

---

#### Phase 6: Advanced (Weeks 16-20)

**Objective:** Mobile/RF operations, advanced warehouse capabilities.

| Task | Deliverable | Reference Pattern |
|------|-------------|-------------------|
| 6.1 | Build RF/Mobile UI | Mobile-first task list, scan station, packing session | `RFPackingSessionPage.tsx`, `ScanStationPage.tsx`, `TaskListPage.tsx` |
| 6.2 | Build Barcode Scanner Widget | Camera-based barcode scanning for desktop + mobile | `barcode-lookup-widget.tsx`, `picking-task-scanner.tsx` |
| 6.3 | Build Slotting Optimization | Slotting rules, optimization suggestions | `SlottingOptimizationPage.tsx` |
| 6.4 | Build Warehouse Setup Wizard | Multi-step warehouse configuration | `WarehouseSetupWizard.tsx`, `ZoneConfigWizard.tsx` |
| 6.5 | Aisles/Bays/Racks Management | Warehouse structure hierarchy management | `AisleManagementPage.tsx`, `BayManagementPage.tsx` |
| 6.6 | Integrations Management | EDI, API key management, integration mappings | `IntegrationsPage.tsx` |
| 6.7 | Facility 3D View | Visual warehouse layout (beyond MVP) | Route exists in reference |

**New files:** ~12 files  
**Modified files:** ~5 files

---

## 7. Appendix: Reference Best Practices to Adopt

### 7.1 UI Patterns (High Priority)

| Pattern | Why It Matters | Where to Apply |
|---------|---------------|----------------|
| **Wizard/Stepper Dialogs** | Multi-step creation flows reduce errors for complex entities (ASN, Sales Orders, Shipping) | ASN creation, Sales Order creation, Shipping Label, Warehouse Setup |
| **Status Badge System** | Consistent status representation across all pages — critical for WMS where every entity has a lifecycle | All domains |
| **Filter Chips** | Users need to see what filters are active at a glance | All list pages |
| **Detail Dialogs** | View-only mode allows inspection without edit risk | ASN, Sales Orders, GRN, Inventory |
| **Action Mapping per Status** | Prevents invalid state transitions — shows only allowed actions | ASN, GRN, Orders, Picking Tasks |
| **Barcode Generation** | LPN/Location barcodes are essential for warehouse operations | LPN labels, Location labels |
| **Barcode Scanning** | Warehouse operators rely on barcode scanning for accuracy | Picking, Receiving, Putaway, Inventory |
| **Server-side Pagination** | Required for enterprise-scale data | All list pages |
| **Audit Metadata** | Warehouse operations require complete audit trails | All entities |

### 7.2 Code Patterns (High Priority)

| Pattern | Why It Matters | Where to Apply |
|---------|---------------|----------------|
| **Centralized status enums with transitions** | Status lifecycles are the backbone of WMS workflow | `types/warehouse-statuses.ts` |
| **Status config maps** | `{ variant, label, className }` mapping for each badge | Badge implementations |
| **DataTable standardization** | Consistent filtering, sorting, pagination across app | Replace all raw `<Table>` usage |
| **Dialog reusability** | `readOnly`, `edit`, `create` modes reduce duplication | New dialog implementations |
| **Wizard state management pattern** | `currentStep` + `STEPS` array + `getStepStatus()` | All multi-step flows |
| **Select/dropdown wrapper components** | Consistent async search selects | `ClientSelect`, `VendorSelect`, `ProductSearchSelect`, `LocationSelect` |

### 7.3 Domain Patterns (High Priority)

| Pattern | Why It Matters | Where to Apply |
|---------|---------------|----------------|
| **Header + Lines pattern** | Every transactional entity needs line-level detail | ASN, Sales Orders, Transfers |
| **Status lifecycle with state machine** | Prevents invalid operations | ASN, GRN, Orders, Pick Tasks |
| **Real-time polling for progress** | Users need to see operation progress without manual refresh | Receiving, QC Inspection |
| **Variance calculation** | Critical for inventory accuracy | GRN Receiving, Cycle Counts |
| **Wave → Pick Task → Execute flow** | Core outbound process | Wave Management, Picking |

---

## Summary of Impact Assessment

| Domain | Current State | Target State | Effort | Impact |
|--------|--------------|--------------|--------|--------|
| **Inbound** | ASN header + GRN status | Full ASN+lines wizard → Receiving → QC → Putaway | High | 🔴 Critical |
| **Outbound** | Order header + Wave | Full wizard → Auto-allocation → Picking → Packing → Shipping | Very High | 🔴 Critical |
| **Inventory** | Stock view + Adjustments | + Cycle count execution + Holds + LPN barcodes + Replenishment | Medium | 🟡 High |
| **Quality** | NCR only | QC inspection workflow + Quality dashboard | Medium | 🟡 High |
| **Mobile/RF** | None | Mobile-first picking, receiving, scanning | High | 🔴 Critical |
| **UI Polish** | Raw tables + inline statuses | DataTable + Badges + Filters + Wizards | Medium | 🔴 Critical |
| **Billing** | None | Billing dashboard + charge review | Medium | 🟡 Medium |
| **Labor** | None | Labor tracking + productivity | Low | 🟡 Medium |

**Total estimated effort:** 16-20 weeks (with 1-2 developers)  
**Priority order:** Phase 1 (Foundation) → Phase 2 (Inbound) → Phase 3 (Outbound) → Phase 4 (Quality/Inventory) → Phase 5 (Operations) → Phase 6 (Advanced)

---

*End of document*
