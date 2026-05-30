# WMS UI Gap Analysis & Implementation Plan

**Date:** May 31, 2026  
**Purpose:** Comprehensive comparison of `nest-wms-ui` (current) vs `reference-wms-ui-frontend` (reference) with detailed gap analysis and phased implementation plan.  
**Scope:** UI/UX patterns, warehouse domain modeling, process workflows, and enterprise readiness.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [UI Gaps](#2-ui-gaps)
3. [Domain Gaps](#3-domain-gaps)
4. [Process Gaps](#4-process-gaps)
5. [Architecture & Component Gaps](#5-architecture--component-gaps)
6. [Navigation & Information Architecture Gaps](#6-navigation--information-architecture-gaps)
7. [Implementation Plan](#7-implementation-plan)
8. [Priority Matrix](#8-priority-matrix)

---

## 1. Executive Summary

### Current State Assessment

The current `nest-wms-ui` project has a solid shadcn-based design system foundation and covers basic CRUD operations for most warehouse domains. However, it fundamentally **lacks warehouse domain expertise** in its UI implementation. The pages are built as generic data tables with simple create dialogs, missing the multi-step workflows, line-item management, status-driven actions, and operational dashboards that a real WMS requires.

### Reference Implementation Strengths

The reference `reference-wms-ui-frontend` demonstrates:
- **Multi-step wizard dialogs** (ASN creation: 3-step, Sales Order: 3-step, Warehouse Setup: 7-step)
- **Line-item management** within parent entities (ASN lines, Sales Order lines, GRN lines)
- **Status-driven action menus** (context-aware actions based on entity status)
- **Operational dashboards** with KPI cards, stats, and real-time tracking
- **Role-based navigation** (Tenant Admin, Warehouse Admin, Warehouse User)
- **Rich dialog library** (50+ specialized dialogs for warehouse operations)
- **Progress tracking** with visual step indicators and progress bars

### Gap Severity Summary

| Category | Gap Count | Critical | High | Medium | Low |
|----------|-----------|----------|------|--------|-----|
| UI Gaps | 12 | 4 | 5 | 2 | 1 |
| Domain Gaps | 15 | 6 | 5 | 3 | 1 |
| Process Gaps | 10 | 4 | 4 | 2 | 0 |
| Architecture Gaps | 8 | 2 | 4 | 2 | 0 |
| Navigation Gaps | 5 | 2 | 2 | 1 | 0 |
| **Total** | **50** | **18** | **20** | **10** | **2** |

---

## 2. UI Gaps

### 2.1 [CRITICAL] No Multi-Step Wizard Dialogs

**Current State:** All create operations use single-page dialogs with basic form fields.

**Reference State:** Complex entities use multi-step wizard dialogs:
- **ASN Create Wizard** (`AsnCreateWizard.tsx`): 3 steps — Basic Info → Line Items → Review & Create
- **Sales Order Create Wizard** (`SalesOrderCreateWizard.tsx`): 3 steps — Basic Info → Line Items → Review & Create  
- **Warehouse Setup Wizard** (`WarehouseSetupWizard.tsx`): 7 steps — Welcome → Zone → Aisle → RackRow → Bay → Level → Review

**Impact:** Users cannot properly create complex warehouse documents. An ASN without line items is meaningless in a real warehouse. A sales order without line items cannot be fulfilled.

**Files Affected:**
- `src/pages/inbound/AsnList.tsx` — Simple dialog, no line items
- `src/pages/outbound/OrderList.tsx` — Simple dialog, no line items
- Warehouse setup has no wizard at all

### 2.2 [CRITICAL] No Line-Item Management

**Current State:** ASN creation dialog has no product line items. Sales order creation has no line items. No entity supports nested line-item CRUD.

**Reference State:** Every complex entity has dedicated line-item management:
- `AsnLineItemsDialog.tsx` — Add/edit/remove ASN line items with product search, UOM selection, lot tracking
- `SalesOrderLineItemsDialog.tsx` — Add/edit/remove order line items with quantity, pricing, UOM
- `GrnLineItemsDialog.tsx` — View/manage GRN line items
- Line items include: product search (with client filtering), UOM selection, lot number, expiry date, quantity validation

**Impact:** Without line items, the WMS cannot track what products are being shipped/received, making the entire inbound and outbound workflow incomplete.

### 2.3 [CRITICAL] No Status-Driven Action Menus

**Current State:** No row-level action menus on data tables. No context-aware operations.

**Reference State:** Every data table has a `MoreVertical` dropdown with context-sensitive actions:
```typescript
const getAllowedActions = (status?: AdvanceShippingNoticeStatus) => ({
  manageLines: status === 'CREATED',
  startReceiving: status === 'ARRIVED',
  markArrived: status === 'CREATED' || status === 'IN_TRANSIT',
  cancel: status === 'CREATED',
  edit: status === 'CREATED',
  delete: status === 'CREATED',
  print: ['ARRIVED', 'IN_RECEIVING', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(status),
  view: true,
})
```

**Impact:** Users cannot perform operational workflows (receive, cancel, manage) from the data table. They must manually enter IDs to perform actions.

### 2.4 [CRITICAL] No Operational KPI/Stats Cards

**Current State:** Pages show only data tables with minimal context.

**Reference State:** Every operational page has stats cards:
```tsx
// ASN Page shows:
Pending: 5 | In Transit: 3 | Arrived: 2 | Received: 12
```
Stats cards include progress indicators, contextual descriptions, and visual separators.

**Impact:** Warehouse operators need at-a-glance visibility into operational status without filtering data.

### 2.5 [HIGH] No Receiving Dialog with Real-Time GRN Tracking

**Current State:** No ASN receiving workflow. No GRN creation from ASN.

**Reference State:** `AsnReceivingDialog.tsx` provides a multi-step receiving process:
1. ASN Validated → 2. GRN Creation → 3. Goods Receiving
- Real-time progress bar
- Status polling for GRN creation
- Auto-close on completion
- Error handling with retry

**Impact:** The receiving workflow is a core warehouse operation. Without it, the inbound process is incomplete.

### 2.6 [HIGH] No Filter Chips / Active Filter Display

**Current State:** Basic filter dropdowns with a "Clear Filters" button.

**Reference State:** `FilterChips` component shows active filters as removable chips with a "Clear All" option, providing better UX for multi-filter scenarios.

### 2.7 [HIGH] No Data Table with Server-Side Pagination

**Current State:** Basic client-side pagination with Previous/Next buttons.

**Reference State:** Server-side pagination with:
- Page size selector (5, 10, 25, 50, 100)
- Page X of Y display
- Total record count
- Sorting on individual columns

### 2.8 [HIGH] No Column Sorting

**Current State:** Static table columns with no sorting capability.

**Reference State:** Sortable columns with `ArrowUpDown` icons, toggle between asc/desc/none.

### 2.9 [HIGH] No Loading States in Tables

**Current State:** Skeleton loading for entire table area.

**Reference State:** `Loader2` spinner with "Loading ASNs..." text inside table body, providing better context.

### 2.10 [MEDIUM] No Page Info / Help Dialogs

**Current State:** No contextual help system.

**Reference State:** `PageInfoDialog` component provides page-specific help information accessible via a "Help" button in the header.

### 2.11 [MEDIUM] No Confirm Dialog for Destructive Actions

**Current State:** No confirmation dialogs for delete operations.

**Reference State:** `ConfirmDialog` component with title, description, confirm/cancel buttons, and destructive variant.

### 2.12 [LOW] No Compact Card Design for Stats

**Current State:** Standard card layouts.

**Reference State:** Compact `CardContent` with vertical separators, inline badges, and truncated descriptions for space-efficient stats display.

---

## 3. Domain Gaps

### 3.1 [CRITICAL] ASN Without ASN Lines

**Current State:**
```typescript
// AsnList.tsx - Create dialog
const createAsnSchema = z.object({
  vendorId: z.string().optional(),
  poNumber: z.string().optional(),
  carrierName: z.string().optional(),
  // ... NO line items, NO products, NO quantities
})
```

**Reference State:**
```typescript
// AsnCreateWizard.tsx - 3-step wizard
interface LineItemDraft {
  id: string
  productId?: number
  productCode?: string
  productName?: string
  uomId?: number
  expectedQuantity: number
  lotNumber?: string
  expiryDate?: string
}
// Creates ASN + Line Items + Auto-GRN in one flow
```

**Warehouse Reality:** An ASN (Advance Shipping Notice) tells the warehouse WHAT is coming. Without line items (product, quantity, UOM), the ASN is just metadata. The receiving process depends on knowing what to expect.

### 3.2 [CRITICAL] Sales Order Without Order Lines

**Current State:**
```typescript
// OrderList.tsx - Create dialog
const orderSchema = z.object({
  clientCode: z.string().min(1, 'Client code is required'),
  orderType: z.string().optional(),
  priority: z.coerce.number().optional(),
  // ... NO line items, NO products, NO quantities
})
```

**Reference State:**
```typescript
// SalesOrderCreateWizard.tsx - 3-step wizard with LineItemsStep
// Line items include: product, quantity, unitPrice, UOM
// After order creation, line items are created via separate API
```

**Warehouse Reality:** A sales order without line items cannot be allocated, picked, packed, or shipped. The entire outbound workflow depends on knowing WHAT to ship.

### 3.3 [CRITICAL] No ASN Status Workflow

**Current State:**
```typescript
const ASN_STATUS_OPTIONS = ['draft', 'sent', 'in_transit', 'received', 'cancelled']
// Manual status update by ID - no workflow
```

**Reference State:**
```typescript
type AdvanceShippingNoticeStatus = 
  'CREATED' | 'IN_TRANSIT' | 'ARRIVED' | 'IN_RECEIVING' | 
  'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED'
// Status-driven actions: manageLines, startReceiving, markArrived, cancel
// Status transitions trigger backend automation (auto-GRN creation)
```

**Warehouse Reality:** ASN status drives the entire inbound workflow:
1. CREATED → Add line items, notify vendor
2. IN_TRANSIT → Track shipment
3. ARRIVED → Truck at dock, start receiving
4. IN_RECEIVING → Scanning and counting
5. PARTIALLY_RECEIVED → Some items received
6. RECEIVED → All items received
7. CLOSED → GRN completed, putaway done

### 3.4 [CRITICAL] No GRN (Goods Receipt Note) Lifecycle

**Current State:** `GrnList.tsx` exists but GRN creation from ASN is not implemented.

**Reference State:** Full GRN lifecycle:
- Auto-created when ASN status changes to ARRIVED
- Status transitions: CREATED → INSPECTION_REQUIRED → INSPECTION_PASSED → COMPLETED
- Quality inspection integration
- Line-item level tracking

**Warehouse Reality:** GRN is the legal document confirming receipt of goods. It must be linked to the ASN and contain line-item details.

### 3.5 [HIGH] No Warehouse Hierarchy (Zone → Aisle → RackRow → Bay → Level → Location)

**Current State:** Flat structure with Zones and Locations only.

**Reference State:** Complete hierarchy with wizard:
```
Facility > Zone > Aisle > RackRow > Bay > Level > Location
```
Each level has proper form fields, validation, and auto-generation of child entities.

**Warehouse Reality:** Warehouse storage is organized hierarchically. Without this, putaway, picking, and inventory management cannot follow real warehouse layouts.

### 3.6 [HIGH] No Quality Inspection Workflow

**Current State:** No quality inspection pages.

**Reference State:** 
- `QualityInspectionManagementPage.tsx` — List and manage inspections
- `QualityInspectionDetailPage.tsx` — Detailed inspection view
- `QualityPage.tsx` — Quality dashboard
- `QualityCheckDialog.tsx` — Perform quality checks
- `GrnQualityInspectionDialog.tsx` — Quality inspection during GRN

**Warehouse Reality:** Quality inspection is a critical step between receiving and putaway. Items must pass QC before being available for picking.

### 3.7 [HIGH] No Cross-Dock Operations

**Current State:** No cross-dock feature.

**Reference State:**
- `CrossDockPage.tsx` — Cross-dock management
- `CrossDockManagementPage.tsx` — Admin cross-dock operations

**Warehouse Reality:** Cross-docking allows direct transfer from inbound to outbound without putaway, critical for high-velocity operations.

### 3.8 [HIGH] No Putaway Rules/Strategies

**Current State:** Basic putaway board.

**Reference State:**
- `PutawayRuleDesigner.tsx` — Visual rule configuration
- `PutawayPage.tsx` — Full putaway workflow with location guidance

**Warehouse Reality:** Putaway rules determine WHERE received goods should be stored based on product type, zone, velocity, etc.

### 3.9 [HIGH] No Wave Management

**Current State:** Basic wave listing.

**Reference State:**
- `WaveManagementPage.tsx` — Full wave management with optimization
- `WaveOptimizationPanel.tsx` — AI-assisted wave optimization
- `CreateWaveDialog.tsx` — Wave creation with order selection
- `WaveVisualizationMap.tsx` — Visual wave representation

**Warehouse Reality:** Wave management groups orders for efficient picking. Without proper wave management, picking operations are inefficient.

### 3.10 [HIGH] No Picking Task Management

**Current State:** Basic wave listing.

**Reference State:**
- `PickingPage.tsx` — Full picking workflow with barcode scanning
- `PickingTaskScreen.tsx` — Task-based picking interface
- `PickListGenerationPage.tsx` — Generate pick lists
- `ShortPickDialog.tsx` — Handle short picks
- `LocationGuidanceCard.tsx` — Guide picker to location

**Warehouse Reality:** Picking is the most labor-intensive warehouse operation. It requires barcode scanning, location guidance, and short-pick handling.

### 3.11 [MEDIUM] No Appointment Scheduling

**Current State:** No appointment feature.

**Reference State:**
- `AppointmentsPage.tsx` — Dock appointment scheduling
- Integrated with ASN and dock management

**Warehouse Reality:** Appointments prevent dock congestion and ensure proper resource allocation.

### 3.12 [MEDIUM] No Yard Management

**Current State:** No yard feature.

**Reference State:**
- `yard/` — Yard management with vehicle tracking

**Warehouse Reality:** Yard management tracks trailers and vehicles in the warehouse yard.

### 3.13 [MEDIUM] No Labor Management

**Current State:** No labor tracking.

**Reference State:**
- `LaborManagementPage.tsx` — Labor allocation and tracking
- `LaborPage.tsx` — Labor dashboard

**Warehouse Reality:** Labor management tracks worker productivity and allocates resources.

### 3.14 [LOW] No 3D Warehouse View

**Current State:** No visual warehouse representation.

**Reference State:**
- `warehouse-3d/` — 3D warehouse visualization

**Nice to have** for visual warehouse management.

---

## 4. Process Gaps

### 4.1 [CRITICAL] No End-to-End Inbound Process

**Current State:** Individual pages exist (ASN, GRN, Putaway) but are disconnected.

**Reference State:** Connected workflow:
```
Create ASN (with lines) → ASN Arrives → Start Receiving → 
Create GRN → Quality Inspection → Putaway → Inventory Updated
```

Each step transitions the status and triggers the next step automatically.

**Missing Connections:**
- ASN creation should include line items
- ASN status change to ARRIVED should auto-create GRN
- GRN should trigger quality inspection
- Quality pass should create putaway tasks
- Putaway completion should update inventory

### 4.2 [CRITICAL] No End-to-End Outbound Process

**Current State:** Individual pages exist (Orders, Allocations, Waves, Shipments) but are disconnected.

**Reference State:** Connected workflow:
```
Create Sales Order (with lines) → Validate → Allocate Inventory → 
Create Wave → Generate Pick Lists → Pick → Pack → Ship
```

**Missing Connections:**
- Order creation should include line items
- Allocation should be triggered from order
- Wave creation should select orders
- Picking should update wave status
- Packing should create shipments
- Shipping should generate labels

### 4.3 [CRITICAL] No Barcode/RF Scanning Integration

**Current State:** No barcode scanning capability.

**Reference State:**
- `barcode-lookup-widget.tsx` — Barcode lookup
- `PickingTaskScreen.tsx` — Scan-based picking
- `PackingPage.tsx` — Scan-based packing
- `picking-task-scanner.tsx` — Task scanner

**Warehouse Reality:** Warehouse workers use barcode scanners for receiving, putaway, picking, packing, and shipping. Without RF scanning, the UI is desktop-only.

### 4.4 [CRITICAL] No Status-Driven Workflow Automation

**Current State:** Manual status updates via dropdown.

**Reference State:** Status transitions trigger backend automation:
- ASN → ARRIVED triggers auto-GRN creation
- GRN → COMPLETED triggers putaway task creation
- Order → ALLOCATED triggers wave eligibility
- Wave → RELEASED triggers pick list generation

### 4.5 [HIGH] No Client/Vendor Select Components

**Current State:** Free-text input for vendor ID and client code.

**Reference State:** Dedicated select components:
- `ClientSelect.tsx` — Searchable client dropdown with name and code
- `VendorSelect.tsx` — Searchable vendor dropdown
- `ProductSearchSelect.tsx` — Product search with client filtering

**Warehouse Reality:** Users shouldn't need to know UUIDs. They should search by name or code.

### 4.6 [HIGH] No Lot/Expiry Tracking in Operations

**Current State:** Lot and expiry fields exist in some schemas but are not used in create dialogs.

**Reference State:** ASN line items include optional lot number and expiry date fields, conditionally shown based on product tracking settings.

**Warehouse Reality:** Expiry-sensitive products (food, pharmaceuticals) require lot and expiry tracking at receipt.

### 4.7 [HIGH] No Print Label Integration

**Current State:** No label printing.

**Reference State:** Print label actions in dropdown menus, `PrintLabelDialog.tsx`, `LabelPrintModal.tsx`.

**Warehouse Reality:** Warehouse operations require label printing for shipping, receiving, and location identification.

### 4.8 [HIGH] No Exception/Hold Management

**Current State:** Basic holds page.

**Reference State:**
- `ApplyHoldDialog.tsx` / `ReleaseHoldDialog.tsx` — Hold/unhold inventory
- `ActiveHoldsDashboard.tsx` — Monitor active holds
- `ExceptionRulesPage.tsx` — Configure exception rules

**Warehouse Reality:** Inventory holds are critical for quality issues, damage, and disputes.

### 4.9 [MEDIUM] No Inventory Moves/Relocation

**Current State:** No inventory moves.

**Reference State:**
- `InventoryMovesPage.tsx` — Move inventory between locations
- `TransferLocationDialog.tsx` — Transfer dialog

**Warehouse Reality:** Inventory relocation is common for rebalancing, consolidating, or moving to picking locations.

### 4.10 [MEDIUM] No Replenishment Workflow

**Current State:** No replenishment.

**Reference State:**
- `ReplenishmentPage.tsx` — Replenishment management
- `replenishment-rules/` — Rule configuration

**Warehouse Reality:** Forward picking locations must be replenished from bulk storage.

---

## 5. Architecture & Component Gaps

### 5.1 [CRITICAL] No Shared Dialog Library

**Current State:** Each page implements its own dialogs inline.

**Reference State:** `src/components/dialogs/` contains 50+ reusable dialogs:
- `CreateGoodsReceiptDialog.tsx`
- `ProcessGRNDialog.tsx`
- `QualityCheckDialog.tsx`
- `PickItemsDialog.tsx`
- `PackShipmentDialog.tsx`
- `ShipmentDetailsDialog.tsx`
- `AdjustStockDialog.tsx`
- `ApplyHoldDialog.tsx`
- `CreateWaveDialog.tsx`
- ... and 40+ more

**Impact:** Code duplication, inconsistent UX, slower development.

### 5.2 [HIGH] No Status Badge Component

**Current State:** Inline badge styling with manual color mapping.

**Reference State:** `StatusBadges.tsx` — Reusable status badge components:
- `AsnStatusBadge` — ASN-specific status colors
- Consistent color scheme across all entities

### 5.3 [HIGH] No Audit Trail Component

**Current State:** No audit trail.

**Reference State:**
- `StatusAuditTrail.tsx` — Status change history
- `AuditMetadata.tsx` — Created/modified timestamps and users

### 5.4 [HIGH] No LPN Display Components

**Current State:** Basic LPN listing.

**Reference State:**
- `LpnDisplayCard.tsx` — Visual LPN representation
- `LpnStatusBadge.tsx` — LPN status indicator
- `LpnTypeBadge.tsx` — LPN type indicator

### 5.5 [MEDIUM] No Spring Pagination Component

**Current State:** Custom pagination.

**Reference State:** `SpringPagination.tsx` — Generic Spring Data pagination component.

### 5.6 [MEDIUM] No Progress Component

**Current State:** No progress indicator.

**Reference State:** shadcn `Progress` component used in wizards and receiving dialogs.

---

## 6. Navigation & Information Architecture Gaps

### 6.1 [CRITICAL] No Role-Based Navigation

**Current State:** Single flat navigation structure for all users.

**Reference State:** Three distinct navigation groups:
1. **Tenant Admin** — Users, Roles, Clients, Facilities, UOM Management
2. **Warehouse Admin** — Dashboard, Order Management, Inbound, Inventory, Outbound, Products, Warehouse Structure
3. **Warehouse User** — Inbound, Outbound, Inventory, Tasks (simplified operational view)

**Impact:** Different user roles see different menus. A warehouse picker shouldn't see admin configuration.

### 6.2 [HIGH] No Warehouse Structure Navigation

**Current State:** Basic Facilities > Zones > Locations.

**Reference State:** Detailed structure navigation:
- Setup Wizard
- Facility 3D View
- Zones → Aisles → Bays → Racks & Levels → Locations → Slotting

### 6.3 [HIGH] No Order Workbench

**Current State:** Separate pages for orders, allocations, waves.

**Reference State:** Unified Order Workbench that shows order lifecycle with expandable line items, allocation status, and wave assignment.

### 6.4 [MEDIUM] No Separate Warehouse User View

**Current State:** One-size-fits-all navigation.

**Reference State:** Simplified warehouse user view with task-focused navigation.

### 6.5 [MEDIUM] No "New" Badges for New Features

**Current State:** No feature badges.

**Reference State:** `badge: 'New'` on sidebar items to highlight new features.

---

## 7. Implementation Plan

### Phase 1: Foundation & Core Wizards (Weeks 1-4)

**Goal:** Establish wizard pattern and fix critical domain gaps.

#### Sprint 1: Wizard Infrastructure & ASN Wizard
1. **Create reusable WizardDialog component**
   - Step indicator with progress
   - Back/Next/Cancel navigation
   - Step validation
   - Configurable steps array

2. **Create ClientSelect component**
   - Searchable dropdown
   - Fetches from client API
   - Shows client name and code

3. **Create VendorSelect component**
   - Searchable dropdown
   - Fetches from vendor API

4. **Create ProductSearchSelect component**
   - Searchable with debounce
   - Client-filtered option
   - Shows product code and name

5. **Build ASN Create Wizard**
   - Step 1: Basic Information (ASN#, PO#, Client, Vendor, Carrier, Tracking, Arrival Date)
   - Step 2: Line Items (Product search, UOM, Quantity, Lot#, Expiry)
   - Step 3: Review & Create (Summary of all data)
   - API: `useCreateAsnWithLinesAndGrn`

#### Sprint 2: ASN Page Enhancement
1. **Build ASN Data Table with:**
   - Server-side pagination
   - Column sorting
   - Status filter dropdown
   - Global search
   - Filter chips

2. **Build Status-Driven Action Menu:**
   - Manage Line Items (CREATED status)
   - Start Receiving (ARRIVED status)
   - Mark as Arrived (CREATED/IN_TRANSIT)
   - Cancel (CREATED status)
   - View Details (always)
   - Edit (CREATED status)
   - Delete (CREATED status)

3. **Build ASN Stats Cards:**
   - Pending count
   - In Transit count
   - Arrived count
   - Received count

4. **Build ASN Details Dialog**
   - Full ASN information display
   - Line items table
   - Status history

5. **Build ASN Line Items Dialog**
   - Add/edit/remove line items
   - Product search with client filtering
   - UOM selection
   - Lot/Expiry tracking

#### Sprint 3: Receiving & GRN
1. **Build ASN Receiving Dialog**
   - Multi-step progress: ASN Validated → GRN Creation → Goods Receiving
   - Real-time GRN status tracking
   - Auto-close on completion

2. **Build GRN Page Enhancement:**
   - Data table with filtering
   - Status-driven actions
   - GRN details with line items

3. **Build Quality Inspection Dialog**
   - Pass/Fail/Conditional options
   - Notes and photos
   - Inspector assignment

#### Sprint 4: Sales Order Wizard
1. **Build Sales Order Create Wizard**
   - Step 1: Basic Information (Customer, Order Date, Delivery Date, Priority)
   - Step 2: Line Items (Product, Quantity, Price, UOM)
   - Step 3: Review & Create

2. **Build Sales Order Page Enhancement:**
   - Data table with sorting/filtering
   - Status-driven actions
   - Line items management
   - Stats cards

### Phase 2: Warehouse Structure & Operations (Weeks 5-8)

**Goal:** Enable warehouse structure management and operational workflows.

#### Sprint 5: Warehouse Setup Wizard
1. **Build Warehouse Setup Wizard (7-step)**
   - Welcome & Overview
   - Zone Configuration
   - Aisle Layout
   - RackRow Setup
   - Bay Configuration
   - Level Configuration
   - Review & Complete

2. **Build Warehouse Structure Pages:**
   - Aisle Management
   - Bay Management
   - Rack & Level Management

#### Sprint 6: Inventory Operations
1. **Build Inventory Moves Page**
   - Source/destination location selection
   - Product and quantity selection
   - Dual transaction creation

2. **Enhance Inventory Adjustments**
   - Approval workflow
   - Status tracking
   - Audit trail

3. **Build Inventory Holds Dashboard**
   - Apply/release holds
   - Hold reasons
   - Affected inventory display

#### Sprint 7: Picking & Packing
1. **Build Order Workbench**
   - Order lifecycle view
   - Expandable line items
   - Allocation status
   - Wave assignment

2. **Build Wave Management**
   - Create wave dialog
   - Wave optimization
   - Wave status tracking

3. **Build Picking Interface**
   - Task-based picking
   - Barcode scanning
   - Location guidance
   - Short pick handling

#### Sprint 8: Shipping & Labels
1. **Build Packing Page**
   - Cartonization
   - Scan-based packing
   - Label generation

2. **Build Shipping Page**
   - Manifest creation
   - Carrier selection
   - Tracking integration

3. **Build Shipping Labels Management**
   - Label generation
   - Print integration
   - Tracking status

### Phase 3: Enterprise Features (Weeks 9-12)

**Goal:** Add role-based navigation, advanced features, and operational dashboards.

#### Sprint 9: Role-Based Navigation
1. **Implement Role-Based Sidebar**
   - Tenant Admin navigation
   - Warehouse Admin navigation
   - Warehouse User navigation
   - Role switching

2. **Build Warehouse Admin Dashboard**
   - KPI widgets
   - Recent activity
   - Alerts and notifications

#### Sprint 10: Advanced Operations
1. **Build Appointment Scheduling**
   - Dock scheduling
   - Time slot management
   - ASN linking

2. **Build Cross-Dock Operations**
   - Direct transfer workflow
   - Eligibility rules

3. **Build Putaway Rules**
   - Rule designer
   - Strategy configuration

#### Sprint 11: Quality & Compliance
1. **Build Quality Inspection Management**
   - Inspection templates
   - Batch inspection
   - NCR (Non-Conformance Reports)

2. **Build Exception Management**
   - Exception rules
   - Automated alerts
   - Resolution workflows

#### Sprint 12: Polish & Optimization
1. **Build Shared Dialog Library**
   - Extract common dialogs
   - Standardize patterns

2. **Build Status Badge System**
   - Centralized status colors
   - Consistent rendering

3. **Build Audit Trail System**
   - Status change history
   - User attribution

4. **Performance Optimization**
   - Query caching
   - Lazy loading
   - Virtual scrolling for large tables

---

## 8. Priority Matrix

### Must Do First (Blocking Other Work)

| # | Item | Phase | Sprint | Effort | Dependencies |
|---|------|-------|--------|--------|--------------|
| 1 | WizardDialog component | 1 | 1 | Medium | None |
| 2 | ClientSelect component | 1 | 1 | Low | Client API |
| 3 | VendorSelect component | 1 | 1 | Low | Vendor API |
| 4 | ProductSearchSelect component | 1 | 1 | Medium | Product API |
| 5 | ASN Create Wizard | 1 | 1 | High | #1, #2, #3, #4 |
| 6 | Status-driven action menu pattern | 1 | 2 | Medium | None |
| 7 | ASN Page with table, stats, actions | 1 | 2 | High | #5, #6 |

### High Impact, Do Next

| # | Item | Phase | Sprint | Effort | Dependencies |
|---|------|-------|--------|--------|--------------|
| 8 | ASN Receiving Dialog | 1 | 3 | High | #7 |
| 9 | Sales Order Create Wizard | 1 | 4 | High | #1, #2 |
| 10 | Warehouse Setup Wizard | 2 | 5 | Very High | None |
| 11 | Order Workbench | 2 | 7 | High | #9 |
| 12 | Wave Management | 2 | 7 | High | #11 |

### Important, Do After Core

| # | Item | Phase | Sprint | Effort | Dependencies |
|---|------|-------|--------|--------|--------------|
| 13 | Role-based navigation | 3 | 9 | Medium | None |
| 14 | Inventory Moves | 2 | 6 | Medium | None |
| 15 | Picking Interface | 2 | 7 | High | #12 |
| 16 | Packing & Shipping | 2 | 8 | High | #15 |
| 17 | Quality Inspection | 3 | 11 | Medium | #8 |

### Nice to Have

| # | Item | Phase | Sprint | Effort | Dependencies |
|---|------|-------|--------|--------|--------------|
| 18 | 3D Warehouse View | 3 | 12 | Very High | #10 |
| 19 | Appointment Scheduling | 3 | 10 | Medium | None |
| 20 | Cross-Dock Operations | 3 | 10 | Medium | #8 |

---

## Appendix A: File Comparison Summary

### Current Project Files (Key Pages)
```
src/pages/inbound/AsnList.tsx          — 294 lines, simple CRUD dialog
src/pages/outbound/OrderList.tsx       — 410 lines, simple CRUD dialog
src/pages/inbound/GrnList.tsx          — GRN listing
src/pages/outbound/WaveList.tsx        — Wave listing
src/pages/inventory/                   — Basic inventory pages
src/pages/warehouse/                   — Basic warehouse pages
```

### Reference Project Files (Key Features)
```
src/features/warehouse-user/inbound/asn/AsnPage.tsx           — 1206 lines, full page with filters, stats, actions
src/features/warehouse-user/inbound/asn/AsnCreateWizard.tsx   — 783 lines, 3-step wizard
src/features/warehouse-user/inbound/asn/AsnReceivingDialog.tsx — 332 lines, receiving with GRN tracking
src/features/warehouse-user/inbound/asn/AsnLineItemsDialog.tsx — Line items management
src/features/warehouse-user/inbound/asn/AsnDetailsDialog.tsx   — Details view
src/features/warehouse-admin/sales-orders/SalesOrderCreateWizard.tsx — 363 lines, 3-step wizard
src/features/warehouse-admin/setup/WarehouseSetupWizard.tsx   — 1346 lines, 7-step wizard
src/features/warehouse-user/outbound/order-workbench/         — Full order workbench
src/features/warehouse-user/outbound/picking/                 — Picking with barcode
src/features/warehouse-user/outbound/packing/                 — Packing workflow
src/features/warehouse-user/outbound/shipping/                — Shipping workflow
src/components/dialogs/                                       — 50+ shared dialogs
src/components/status-badges/                                 — Status badge system
```

---

## Appendix B: Recommended Component Extraction List

These components should be extracted from the reference implementation and adapted for the current project:

1. **WizardDialog** — Generic multi-step wizard wrapper
2. **ClientSelect** — Client dropdown with search
3. **VendorSelect** — Vendor dropdown with search
4. **ProductSearchSelect** — Product search with client filtering
5. **FilterChips** — Active filter display
6. **StatusBadge** — Centralized status badges
7. **ConfirmDialog** — Destructive action confirmation
8. **PageInfoDialog** — Contextual help
9. **SpringPagination** — Server-side pagination
10. **DataTable** — Enhanced table with sorting, filtering, pagination

---

*This document should be reviewed and updated as implementation progresses. Each sprint should produce working software that can be demonstrated and validated against real warehouse scenarios.*