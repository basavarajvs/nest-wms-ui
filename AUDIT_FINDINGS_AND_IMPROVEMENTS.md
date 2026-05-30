# WMS UI — Audit Findings & Improvement Plan

Audited: 2026-05-30
Scope: Gap Analysis items P0–P2 against actual integration in UI directories

---

## Executive Summary

The initial implementation successfully created CRUD screens for 19 new feature modules and updated 2 existing ones. However, a **WMS domain expert audit** reveals that the integration is **superficially complete but operationally shallow**. Most features stop at basic Create–Read–Update–Delete table patterns, while the underlying APIs expose rich lifecycle workflows, status transitions, line-item management, and domain-specific operations that are **not wired into the UI**.

---

## 1. Directory Integration Audit

| Directory | Files | Status |
|-----------|-------|--------|
| `src/lib/api/wms-api/` | 9 API files | ✅ All generated |
| `src/lib/types/wms-api/` | 151 DTOs | ✅ Comprehensive |
| `src/features/*/data/` | 37 query hook files | ✅ All with `use*` exports |
| `src/features/*/index.tsx` | 19 new + existing | ✅ Component exports match route imports |
| `src/pages/*/` | 27 page dirs | ✅ Page wrappers exist |
| `src/routes/_authenticated/` | 66 routes | ✅ Routes registered |
| `src/components/layout/data/sidebar-data.ts` | 1 file | ✅ Navigation links added |

**Conclusion**: File structure integration is complete. No missing files.

---

## 2. Critical Domain Gaps (Beyond CRUD)

### 2.1 ❌ Goods Receipt (GRN) — No Feature Component Exists

**Status**: ⚠️ PARTIAL — GRN page at `src/pages/inbound/Grns.tsx` exists, but `src/features/inbound/goods-receipt/` has **NO feature component** (`index.tsx`). The route `src/routes/_authenticated/inbound/goods-receipt.tsx` references a feature component that doesn't exist.

**Available API endpoints NOT integrated** (from `InboundWebController`):
| Endpoint | Purpose | UI Status |
|----------|---------|-----------|
| `markArrived` | Mark GRN as arrived | ❌ Missing |
| `startReceiving` | Begin receiving process | ❌ Missing |
| `markReceived` | Complete receiving | ❌ Missing |
| `startInspection` | Begin QC inspection | ❌ Missing |
| `completeInspection` | Complete QC inspection | ❌ Missing |
| `cancelGrn` | Cancel GRN | ❌ Missing |
| `markPartial` | Mark as partial receipt | ❌ Missing |
| `getValidNextStatuses` | Get allowed transitions | ❌ Missing |
| `inspectQc` | Record QC inspection | ❌ Missing |
| `applyDisposition` | Apply QC disposition | ❌ Missing |
| `createGrnAdHoc` | Create GRN without ASN | ⚠️ Hook exists, not in UI |
| `getGrnProgress` | Track receiving progress | ⚠️ Hook exists, not in UI |

**Query hooks that exist but are unused**: `useCreateGrnAdHoc`, `useGrnProgress`, `useGetGrnProgress`

### 2.2 ❌ Purchase Orders — PO Lines Not Integrated

**Available API endpoints NOT integrated** (from `PurchaseOrderLineWebController`):
| Endpoint | Purpose | UI Status |
|----------|---------|-----------|
| `create` | Add line to PO | ❌ Not in PO screen |
| `findAll` | List lines for PO | ❌ Not in PO screen |
| `findById` | Get single line | ❌ Not in PO screen |
| `update` | Edit PO line | ❌ Not in PO screen |
| `delete` | Remove PO line | ❌ Not in PO screen |
| `findByPoId` | Lines by PO ID | ❌ Not in PO screen |

**Query hooks that exist**: `usePurchaseOrderLines`, `useCreatePurchaseOrderLine`, `useUpdatePurchaseOrderLine`, `useDeletePurchaseOrderLine` — all unused in the UI.

### 2.3 ❌ Customer Returns — Return Items Not Integrated

**Available API endpoints NOT integrated** (from `CustomerReturnItemWebController`):
| Endpoint | Purpose | UI Status |
|----------|---------|-----------|
| `create` | Add return item | ❌ Not in returns screen |
| `findAll` | List return items | ❌ Not in returns screen |
| `update` | Update condition/disposition | ❌ Not in returns screen |
| `delete` | Remove return item | ❌ Not in returns screen |
| `findByReturnId` | Items by return ID | ❌ Not in returns screen |

**Query hook that exists but unused**: `useReturnItems`

### 2.4 ❌ LPN Management — Missing Operations

**Available API endpoints partially integrated**:
| Endpoint | UI Status |
|----------|-----------|
| `list` | ✅ Integrated |
| `create` | ✅ Integrated |
| `update` | ✅ Integrated (edit dialog) |
| `delete` | ✅ Integrated |
| `move` | ✅ Integrated (Move dialog) |
| `findByNumber` | ❌ Not used in UI |
| `findByLocation` | ❌ Not used in UI |
| `findByGrnLineId` | ❌ Not used in UI |
| `getHierarchy` | ❌ Not used in UI |
| `getChildren` | ❌ Not used in UI |
| `nest` | ❌ Not used in UI |
| `unnest` | ❌ Not used in UI |
| `updateStatus` | ❌ Not used in UI |
| `available` | ❌ Not used in UI |
| `availableForShipment` | ❌ Not used in UI |
| `productAvailableQty` | ❌ Not used in UI |

**Available query hooks unused**: `useFindLpnByNumber`, `useLpnChildren`, `useAvailableLpns`, `useAvailableForShipmentLpns`, `useUpdateLpnStatus`, `useNestLpn`, `useUnnestLpn`

### 2.5 ❌ Cycle Counting — Analytics & Advanced Operations Missing

**Available API endpoints partially integrated**:
| Endpoint | UI Status |
|----------|-----------|
| `list` | ✅ Integrated (with filters + pagination) |
| `schedule` | ✅ Integrated |
| `adhoc` | ❌ Not used in UI |
| `batchSubmit` | ❌ Not used in UI |
| `finalize` | ❌ Not used in UI |
| `getLines` | ❌ Not used in UI |
| `summary` | ❌ Not used in UI |

**Missing query hooks**: No `useAdhocCount`, `useBatchSubmitCount`, `useFinalizeCount`, `useCountLines`, `useCountSummary` hooks exist.

### 2.6 ❌ Carrier Rate Shopping — Compare & Quote Missing

**Available API endpoints partially integrated**:
| Endpoint | UI Status |
|----------|-----------|
| `findRates` | ✅ Integrated (list) |
| `createRate` | ✅ Integrated (create dialog) |
| `deleteRate` | ✅ Integrated |
| `compareRates` | ❌ Not used in UI |
| `getQuote` | ❌ Not used in UI |

**Missing query hooks**: No `useGetQuote` hook exists. `useCompareCarrierRates` exists but is not used in the UI.

### 2.7 ❌ Product Packaging — Convert Operation Missing

**Available API endpoints partially integrated**:
| Endpoint | UI Status |
|----------|-----------|
| `findAll` | ✅ Integrated |
| `create` | ✅ Integrated |
| `update` | ✅ Integrated |
| `delete` | ✅ Integrated |
| `convert` | ❌ Not used in UI |

**Missing**: No UI for UOM conversion (e.g., convert 10 EA → CS based on conversion factor).

### 2.8 ❌ Loads — Missing Shipment Association

**Available API endpoints**:
| Endpoint | UI Status |
|----------|-----------|
| `findByLoadNumber` | ❌ Hook exists, not used in UI |
| Shipment-to-load association | ❌ No endpoint exists but no UI for adding/removing shipments from a load |

### 2.9 ❌ GRN Lifecycle Status Transitions

The GRN page (`Grns.tsx`) exists but has NO status transition buttons. A WMS GRN workflow requires:
- "Mark Arrived" → enables receiving
- "Start Receiving" → begins line-by-line receiving
- "Mark Received" → confirms quantities
- "Start Inspection" → QC phase
- "Complete Inspection" → QC done
- "Mark Completed" → finalizes GRN
- "Mark Partial" → partial receipt

None of these are implemented.

### 2.10 ❌ VAS Execution — No Execution Workflow

The feature is named "VAS Execution" but contains only CRUD. Missing:
- "Start Task" / "Complete Task" action buttons
- Task assignment to workers
- Task events timeline (the API has `addEvent` and `getEvents`)
- **Available query hooks unused**: `useVasTaskEvents`

### 2.11 ❌ NCR — No Status Transitions

Missing:
- Status transition buttons (Open → Investigating → Resolved → Closed)
- Severity dropdown in form (currently free-text)

### 2.12 ❌ Exception Management — No Resolution Workflow

Missing:
- Status transition buttons (Open → Acknowledged → Resolved → Closed)
- Severity dropdown in form (currently free-text)

---

## 3. UI/UX Expert Findings

### 3.1 🔴 No Status Workflow UI Pattern

Only **Loads** and **Inventory Reservations** have inline status-transition action buttons. All other status-driven entities (NCR, Exceptions, GRN, Cycle Counts) display a status badge but no way to change it from the UI.

**Recommendation**: Add a consistent `StatusActions` component pattern: a dropdown or button group showing allowed next transitions (potentially driven by `getValidNextStatuses` where available).

### 3.2 🔴 All ID Fields are Free-Text Inputs

Every form dialog uses `<Input>` for entity IDs (facilityId, locationId, productId, uomId, carrierId, etc.). In a real WMS:
- Facility should be a dropdown linked to `useFacilities`
- Location should be a searchable select linked to `useLocations`
- Product should be a searchable select linked to `useProducts`
- UOM should be a dropdown from UOM master data

**Recommendation**: Replace with `SearchableSelect`, `ComboBox`, or `Select` components populated from query hooks.

### 3.3 🔴 No Expand/Detail Views

All tables are flat. In a WMS, users need to:
- Click an LPN row to see its contents (children/hierarchy)
- Click a PO row to see its lines
- Click a Load row to see its shipments/LPNs
- Click a Cycle Count row to see its count lines

**Recommendation**: Add either:
- Expandable rows (`<Table><TableRow><TableCell colSpan={n}>...</TableCell></TableRow></Table>`)
- Detail panel slide-overs (`<Sheet>` from shadcn)
- Detail pages (nested routes)

### 3.4 🔴 Client-Side Pagination

Most components fetch ALL records and paginate client-side (`.slice(page * limit, ...)`). Only Cycle Counts and Products use server-side pagination.

**Recommendation**: Add server-side pagination everywhere using the params that API endpoints already accept (page, limit, search, filters).

### 3.5 🔴 No Bulk Operations

No feature supports multi-select or batch actions (bulk delete, bulk status change, bulk print).

### 3.6 🟡 No Loading States at Row Level

Action buttons (Move, Release, Mark Loaded, etc.) do not show per-row loading spinners. The button is only disabled during the mutation. No "optimistic updates" are used.

### 3.7 🟡 No Error Boundaries

No feature component wraps itself in an `<ErrorBoundary>`. A crash in one table row dialog could break the entire page.

### 3.8 🟡 No Keyboard Shortcuts

No shortcuts for common actions (Ctrl+N for new, Ctrl+F for search, Escape to close dialog). Not critical for MVP but expected in warehouse floor operations.

### 3.9 🟡 No Role-Based Action Visibility

No feature checks user permissions before showing Create/Edit/Delete buttons. In a real WMS, only supervisors/managers can delete/adjust inventory.

---

## 4. Missing Query Hooks vs API Endpoints

| Controller | Total API Endpoints | Unique Query Hooks | Coverage |
|-----------|-------------------|-------------------|----------|
| InboundWebController | 17 | 4 (`useCreateGrnFromAsn`, `useCreateGrnAdHoc`, `useGrnProgress`, `useGetGrnProgress`) | **24%** |
| LpnWebController | 17 | 11 (8 used via `useLpn*`, 3 unused) | **65%** |
| PurchaseOrderWebController | 5 | 5 | **100%** |
| PurchaseOrderLineWebController | 6 | 4 | **67%** |
| CustomerReturnWebController | 5 | 5 | **100%** |
| CustomerReturnItemWebController | 6 | 1 (`useReturnItems`) | **17%** |
| LoadWebController | 8 | 8 | **100%** |
| CountWebController | 7 | 2 (`useCycleCounts`, `useScheduleCount`) | **29%** |
| CarrierRateShoppingWebController | 5 | 4 | **80%** |
| ProductPackagingWebController | 6 | 4 | **67%** |
| VasExecutionWebController | 7 | 6 | **86%** |

**Weighted Overall API Coverage: ~60%** (counting endpoint-to-hook mapping, not feature-to-ui mapping)

---

## 5. Priority Implementation Plan

### Phase 1 — Build-Fixing (Must fix now)
| # | Item | Effort |
|---|------|--------|
| 1 | Create `src/features/inbound/goods-receipt/index.tsx` feature component for GRN | 1h |
| 2 | Add GRN status transition buttons (Mark Arrived, Mark Received, Complete, Cancel) | 2h |
| 3 | Add GRN lifecycle query hooks (arrived, received, completed transitions) | 0.5h |

### Phase 2 — WMS Workflow Depth (High value, P1)
| # | Item | Effort |
|---|------|--------|
| 4 | PO Lines: Add expandable line-items table inside PO detail/row | 2h |
| 5 | PO Lines: Add create/edit/delete dialogs for individual lines | 2h |
| 6 | Return Items: Add expandable items table inside Customer Return row | 2h |
| 7 | Return Items: Add create/edit/delete dialogs for individual return items | 2h |
| 8 | LPN Hierarchy: Add "View Children" expandable row showing nested LPNs | 2h |
| 9 | LPN Nest/Unnest: Add nest dialog (select parent LPN) | 1.5h |
| 10 | LPN Status: Add status change dropdown in table row | 1h |
| 11 | Cycle Count Adhoc: Add adhoc count initiation dialog | 1.5h |
| 12 | Cycle Count Batch Submit: Add batch submit button for count lines | 1h |
| 13 | Cycle Count Summary: Add summary/analytics view | 2h |

### Phase 3 — UI/UX Quality (P2)
| # | Item | Effort |
|---|------|--------|
| 14 | Replace free-text ID inputs with searchable dropdowns (facility, product, location, UOM) | 4h |
| 15 | Convert client-side pagination to server-side for all list queries | 3h |
| 16 | Add per-row loading states on action buttons | 1h |
| 17 | Add ErrorBoundary wrappers to all feature components | 0.5h |
| 18 | Carrier Rate Compare: Wire up "Compare Rates" button that calls `useCompareCarrierRates` | 2h |
| 19 | Carrier Rate Quote: Add "Get Quote" dialog for real-time carrier quotes | 2h |
| 20 | Product Packaging Convert: Add conversion UI (from UOM → to UOM, enter qty, show result) | 1.5h |
| 21 | VAS Events: Add event timeline to VAS task detail | 1.5h |
| 22 | NCR Status transitions: Add status action buttons | 1.5h |
| 23 | Exception status transitions: Add status action buttons | 1.5h |
| 24 | Shipping Label Preview: Add preview button that calls `getPdf` | 1h |

### Phase 4 — Polish (P3)
| # | Item | Effort |
|---|------|--------|
| 25 | Add keyboard shortcuts for common actions | 2h |
| 26 | Add role-based UI element visibility | 3h |
| 27 | Add bulk selection + batch operations | 4h |
| 28 | Add optimistic updates for mutations | 2h |
| 29 | Add detail/Sheet panels for all entities (click row → side panel) | 6h |

---

## 6. Files That Need Changes (Summary)

| File | Action Required |
|------|----------------|
| `src/features/inbound/goods-receipt/index.tsx` | **CREATE** — GRN feature component missing entirely |
| `src/features/inbound/goods-receipt/data/grn-queries.ts` | Add status transition mutations (`useMarkGrnArrived`, `useMarkGrnReceived`, `useMarkGrnCompleted`, `useCancelGrn`, `useStartReceiving`, `useStartInspection`, `useCompleteInspection`) |
| `src/features/cycle-counts/data/cycle-count-queries.ts` | Add `useAdhocCount`, `useBatchSubmitCount`, `useFinalizeCount`, `useCountLines`, `useCountSummary` |
| `src/features/carrier-rate-shopping/data/carrier-rate-queries.ts` | Add `useGetQuote` hook |
| `src/features/carrier-rate-shopping/index.tsx` | Add "Compare Rates" button + results display, "Get Quote" dialog |
| `src/features/product-packaging/index.tsx` | Add "Convert" button + dialog |
| `src/features/lpns/index.tsx` | Add "View Children" expand, "Nest" dialog, "Status Change" dropdown |
| `src/features/purchase-orders/index.tsx` | Add expandable PO lines table + CRUD |
| `src/features/customer-returns/index.tsx` | Add expandable return items table + CRUD |
| `src/features/vas-execution/index.tsx` | Add "Start Task"/"Complete Task" buttons + event timeline |
| `src/features/ncr/index.tsx` | Add status transition buttons + severity dropdown |
| `src/features/exception-management/index.tsx` | Add status transition buttons + severity dropdown |
| `src/features/loads/index.tsx` | Add "Shipments on Load" view |
| `src/features/shipping-labels/index.tsx` | Add "Preview" button (getPdf) |
| All feature `index.tsx` files | Replace `<Input>` IDs with searchable `<Select>`/`<Combobox>`, add server-side pagination |

---

*End of audit findings. Generated 2026-05-30.*
