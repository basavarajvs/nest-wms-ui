# Field Width Analysis — WMS UI Data Tables

## Problem Statement
Across all data tables in the WMS UI, column widths are not intelligently planned. No explicit `width`, `minSize`, or `maxSize` properties are set on any column definitions. All columns get equal space via the browser's default table-layout algorithm, causing:
- **Narrow fields** (status badges, quantities, codes) waste excessive horizontal space
- **Wide fields** (descriptions, product names) get truncated unnecessarily
- **Action columns** have more space than needed
- **Overall table width** fails to show the right information density

---

## Field Type Classification & Recommended Widths

### 1. Code / Identifier Fields
**Fields**: `productCode`, `poNumber`, `lpnNumber`, `clientCode`, `rateCode`, `cycleCode`, `shiftCode`, `equipmentCode`, `aisleCode`, `appointmentNumber`, `workOrderNumber`, `inspectionNumber`, `invoiceNumber`, `serviceCode`

| Property | Value |
|----------|-------|
| **Typical content length** | 5–18 characters |
| **Recommendation** | `minSize: 100, maxSize: 160` |
| **CSS equivalent** | `w-[120px]` |
| **Reasoning** | Codes are typically alphanumeric with short prefixes. E.g., `PO-2024-00123` is ~14 chars. 120px comfortably fits 14–16 chars in `font-mono text-xs` or `font-medium`. Rarely exceed 160px. |
| **Applies to pages** | Products, Purchase Orders, LPNs, Clients, Billing Cycles/Rates, Labor Shifts, Equipment, Warehouses (aisles/bays), Dock Appointments, Work Orders, Inspections, VAS Services, Invoices |

### 2. Name / Title Fields
**Fields**: `name`, `productName`, `clientName`, `rateName`, `shiftName`, `equipmentName`, `serviceName`, `facilityName`, `cycleName`

| Property | Value |
|----------|-------|
| **Typical content length** | 10–60 characters |
| **Recommendation** | `minSize: 150, maxSize: 300` |
| **CSS equivalent** | `w-[200px]` or `min-w-[150px] max-w-[300px]` |
| **Reasoning** | Names are the most variable-length field. They must get the most space. 200px is a good default that fits ~20–25 chars in `text-sm`. Expand to 300px for longer names on wider screens. |
| **Applies to pages** | Products, Stock Levels, Clients, Billing (rates/cycles), Equipment, Shifts, VAS Services, Inspections, Work Orders |

### 3. Description / Notes Fields
**Fields**: `description`, `notes`, `comments`

| Property | Value |
|----------|-------|
| **Typical content length** | 50–500+ characters |
| **Recommendation** | `minSize: 180, maxSize: 300`, with `className="truncate max-w-[200px]"` |
| **CSS equivalent** | `max-w-[200px] truncate` (already partially implemented) |
| **Reasoning** | Descriptions must be truncated. The existing `max-w-[200px] truncate` pattern is correct. Keep it. |
| **Applies to pages** | Products (Description, Tracking) |

### 4. Short Text / Enum Fields
**Fields**: `type`, `lpnType`, `reservationType`, `chargeType`, `appointmentType`, `workOrderType`, `inspectionType`, `equipmentType`, `frequency`, `category`, `uomId`, `timezone`

| Property | Value |
|----------|-------|
| **Typical content length** | 3–15 characters |
| **Recommendation** | `minSize: 90, maxSize: 140` |
| **CSS equivalent** | `w-[110px]` |
| **Reasoning** | These are short enum values (e.g., `FORKLIFT`, `MONTHLY`, `KITTING`, `EA`, `INBOUND`). 110px fits comfortably with 1–2 line padding. Never need more than 140px. |
| **Applies to pages** | LPNs, Equipment, Dock Appointments, Work Orders, Inspections, VAS Services, Inventory Reservations, Billing Charges/Cycles |

### 5. Quantity / Numeric Fields
**Fields**: `quantity`, `onHand`, `allocated`, `reserved`, `available`, `orderedQuantity`, `receivedQuantity`, `requestedQuantity`, `suggestedQty`, `currentQty`, `minQty`, `maxQty`, `billingDay`, `lineNumber`, `totalPallets`, `totalSqft`, `totalCubicFt`, `estimatedTimeMinutes`

| Property | Value |
|----------|-------|
| **Typical content length** | 1–10 digits |
| **Recommendation** | `minSize: 70, maxSize: 110`, **right-aligned** with `font-mono` |
| **CSS equivalent** | `w-[90px] text-right font-mono` |
| **Reasoning** | Numbers rarely exceed 8 digits (10M). Right-aligned `font-mono` is standard for data tables. 90px fits 10 digits comfortably. The `text-right` alignment is already used in some places—standardize it. |
| **Applies to pages** | Stock Levels, Purchase Orders (lines), LPNs, Inventory Reservations, Replenishment, Billing (snapshots/charges), Work Orders, VAS Services |

### 6. Currency / Monetary Fields
**Fields**: `totalAmount`, `chargeAmount`, `rateApplied`, `defaultRate`, `unitPrice`, `unitCost`

| Property | Value |
|----------|-------|
| **Typical content length** | 5–12 characters (e.g., `$1,234.56`) |
| **Recommendation** | `minSize: 100, maxSize: 140`, **right-aligned** with `font-mono` |
| **CSS equivalent** | `w-[120px] text-right font-mono` |
| **Reasoning** | Currency formatting (`$X,XXX.XX`) takes slightly more space than plain numbers. Right-align and monospace for proper readability. |
| **Applies to pages** | Invoices, Charges, VAS Services (rates), Client Rates, Purchase Orders (line items) |

### 7. Date / DateTime Fields
**Fields**: `orderDate`, `expectedDate`, `scheduledDate`, `completedAt`, `createdAt`, `periodStart`, `periodEnd`, `dueDate`, `snapshotDate`, `effectiveAt`, `expiresAt`, `scheduledStart`, `scheduledEnd`

| Property | Value |
|----------|-------|
| **Typical content length** | 10–20 characters |
| **Recommendation** | `minSize: 100, maxSize: 160` |
| **CSS equivalent** | `w-[130px] text-xs text-muted-foreground` |
| **Reasoning** | `MM/DD/YYYY` = 10 chars, `MM/DD/YYYY hh:mm AM` = ~20 chars. 130px fits most date formats. For date-time ranges (e.g., `Jan 15 – Feb 14`), use 160px. |
| **Applies to pages** | Purchase Orders, Invoices, Billing (charges/snapshots/cycles), Dock Appointments, Work Orders, Inspections, Replenishment (history), Labor (shifts), Equipment (maintenance) |

### 8. Status / Priority Badge Fields
**Fields**: `status`, `priority`, `isActive`, `velocityClass`

| Property | Value |
|----------|-------|
| **Typical content length** | 4–15 characters (badge includes padding) |
| **Recommendation** | `minSize: 80, maxSize: 120` |
| **CSS equivalent** | `w-[100px]` |
| **Reasoning** | Status badges like `IN_PROGRESS`, `CONDITIONAL`, `DECOMMISSIONED` are 5–14 chars + badge padding (~8px each side). 100px fits the longest status. Active/Inactive boolean badges need only ~80px. |
| **Applies to pages** | ALL pages (ubiquitous) |

### 9. Location / Reference Fields
**Fields**: `locationId`, `referenceId`, `reference`, `fromLocationId`, `toLocationId`, `bulkLocationId`, `pickLocationId`, `dockName`, `carrierName`, `driverName`, `vehiclePlate`, `vendorId`

| Property | Value |
|----------|-------|
| **Typical content length** | 8–25 characters |
| **Recommendation** | `minSize: 100, maxSize: 180` |
| **CSS equivalent** | `w-[140px] font-mono text-xs` |
| **Reasoning** | Location codes (e.g., `A-01-B-02-C-03`) are often hierarchical. 140px fits most warehouse location codes. Dock names are shorter (~10 chars). Carrier/driver names are like name fields. |
| **Applies to pages** | Stock Levels, Inventory Transactions, LPNs, Replenishment, Dock Appointments, Equipment, Transfers, Purchase Orders |

### 10. UUID / Long ID Fields
**Fields**: `id`, `productId`, `facilityId`, `clientId`, `assignedToUserId`, `parentId`

| Property | Value |
|----------|-------|
| **Typical content length** | 36 characters (UUID v4) |
| **Recommendation** | Always show truncated (first 8–12 chars) or wrap in a tooltip |
| **CSS equivalent** | `max-w-[120px] truncate font-mono text-xs` |
| **Reasoning** | Full UUIDs are unusable at 36 chars. Current pattern of `id.substring(0, 12)...` is correct. Standardize across all tables. The column itself should be `100px` since we only show truncated form. |
| **Applies to pages** | Replenishment (task ID), Invoices, LPN Children SubTable |

### 11. Tracking Badge Fields (Multi-value)
**Fields**: `trackLot`, `trackSerial`, `trackExpiry` (shown as combined badges)

| Property | Value |
|----------|-------|
| **Typical content length** | 3 small badges |
| **Recommendation** | `minSize: 100, maxSize: 160` |
| **CSS equivalent** | `w-[130px]` |
| **Reasoning** | Combines up to 3 `xs` badges (Lot, Serial, Expiry). ~130px is sufficient. Current `hidden md:table-cell` on this column is correct. |
| **Applies to pages** | Products |

### 12. Expander / Selection Checkbox Columns
| Property | Value |
|----------|-------|
| **Recommendation** | `minSize: 40, maxSize: 50` |
| **CSS equivalent** | `w-[40px]` |
| **Reasoning** | Chevron expander or checkbox needs minimal space. Current `h-8 w-8` buttons are already 32px. Set column to 40px. |
| **Applies to pages** | Purchase Orders, LPNs |

### 13. Actions Column (Icon buttons)
**Fields**: Edit, Delete, Move, Release, View, etc.

| Property | Value |
|----------|-------|
| **Typical content length** | 1–3 icon buttons |
| **Recommendation** | `minSize: 80, maxSize: 140` per button group |
| **CSS equivalent** | `w-[100px] text-right` for 2 buttons, `w-[140px]` for 3+ |
| **Reasoning** | Each `h-8 w-8` button is 32px + gap. For 2 buttons = ~76px. For 3 buttons = ~108px. For text buttons (e.g., "Check In", "Complete") = ~80px per button. DO NOT let actions column stretch. |
| **Applies to pages** | ALL pages with CRUD operations |

---

## Page-by-Page Analysis

### Products (`ProductList.tsx`)
| Column | Current Width | Recommended | Notes |
|--------|-------------|-------------|-------|
| Code | Flexible → 120px | `w-[120px]` | Short codes |
| Name | Flexible → 200px | `w-[200px]` | Variable-length product name |
| Description | `max-w-[200px] truncate` ✓ | `w-[200px]` | Already correct |
| Tracking | `hidden md:table-cell` | `w-[130px]` | Badge group |
| Category | `hidden sm:table-cell` | `w-[120px]` | Category name |
| Velocity | `hidden sm:table-cell` | `w-[90px]` | Single letter badge |
| Status | Flexible → 100px | `w-[100px]` | Active/Inactive badge |
| Actions | Flexible → 100px | `w-[100px]` | 2 icon buttons |

### Stock Levels (`StockList.tsx`)
| Column | Current Width | Recommended | Notes |
|--------|-------------|-------------|-------|
| Product | Flexible → 220px | `w-[220px]` | Name + ID subtitle |
| Location / Lot | Flexible → 160px | `w-[160px]` | Location + lot subtitle |
| On Hand | Flexible → 90px | `w-[90px] text-right` | Numeric |
| Allocated | Flexible → 90px | `w-[90px] text-right` | Numeric |
| Reserved | Flexible → 90px | `w-[90px] text-right` | Numeric |
| Available | Flexible → 90px | `w-[90px] text-right` | Numeric (computed) |
| Status | Flexible → 100px | `w-[100px]` | Badge |

### Purchase Orders (`purchase-orders/index.tsx`)
| Column | Current Width | Recommended | Notes |
|--------|-------------|-------------|-------|
| Expander | Flexible → 40px | `w-[40px]` | Chevron icon |
| PO Number | Flexible → 130px | `w-[130px]` | PO-XXXXX format |
| Facility | Flexible → 120px | `w-[120px]` | Facility code |
| Vendor | Flexible → 150px | `w-[150px]` | Vendor name |
| Order Date | Flexible → 120px | `w-[120px]` | Date |
| Status | Flexible → 100px | `w-[100px]` | Badge |
| Actions | Flexible → 100px | `w-[100px]` | 2 icon buttons |

### PO Lines SubTable
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Line # | `w-[80px]` | `w-[80px]` (already set) |
| Product | Flexible → 200px | `w-[200px]` |
| Qty Ordered | Flexible → 100px | `w-[100px]` |
| Qty Received | Flexible → 100px | `w-[100px]` |
| UOM | Flexible → 80px | `w-[80px]` |
| Unit Price | Flexible → 100px | `w-[100px]` |
| Actions | `w-[80px]` ✓ | `w-[80px]` (already set) |

### Inventory Transactions (`TransactionList.tsx`)
| Column | Current Width | Recommended | Notes |
|--------|-------------|-------------|-------|
| Type | Flexible → 100px | `w-[100px]` | Short type |
| Product | Flexible → 150px | `w-[150px]` | Product ID (truncated) |
| Qty | `text-right` ✓ | `w-[90px] text-right` | Numeric |
| Location | Flexible → 140px | `w-[140px]` | Location code |
| Reference | Flexible → 130px | `w-[130px]` | Reference number |
| Date | `hidden md:table-cell` | `w-[150px]` | DateTime with time |

### Clients (`clients/index.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 120px | `w-[120px]` |
| Name | Flexible → 250px | `w-[250px]` |
| Status | Flexible → 100px | `w-[100px]` |
| Actions | Flexible → 140px | `w-[140px]` | 2 icons + Assign button |

### Client Facility Assignments (sub-dialog)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Facility | Flexible → 200px | `w-[200px]` |
| Effective | Flexible → 120px | `w-[120px]` |
| Expires | Flexible → 120px | `w-[120px]` |
| Status | Flexible → 100px | `w-[100px]` |
| Actions | Flexible → 100px | `w-[100px]` |

### LPNs (`lpns/index.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Expander | Flexible → 40px | `w-[40px]` |
| LPN Number | Flexible → 140px | `w-[140px]` |
| Type | Flexible → 100px | `w-[100px]` |
| Location | Flexible → 140px | `w-[140px]` |
| Product | Flexible → 150px | `w-[150px]` |
| Qty | Flexible → 90px | `w-[90px]` |
| Status | `w-[130px]` select | `w-[130px]` (already functional) |
| Actions | Flexible → 120px | `w-[120px]` | 3 icon buttons |

### Equipment (`equipment/pages/EquipmentListPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 120px | `w-[120px]` |
| Name | Flexible → 200px | `w-[200px]` |
| Type | Flexible → 120px | `w-[120px]` |
| Status | Flexible → 130px | `w-[130px]` |
| Location | Flexible → 140px | `w-[140px]` |
| Serial # | Flexible → 130px | `w-[130px]` |
| Actions | Flexible → 200px | `w-[200px]` | Text buttons + icons |

### Labor Shifts (`shifts/pages/ShiftsPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 120px | `w-[120px]` |
| Name | Flexible → 200px | `w-[200px]` |
| Start | Flexible → 90px | `w-[90px]` | Time (HH:MM) |
| End | Flexible → 90px | `w-[90px]` | Time (HH:MM) |
| Timezone | Flexible → 120px | `w-[120px]` | Short TZ code |
| Active | Flexible → 100px | `w-[100px]` |
| Actions | Flexible → 80px | `w-[80px]` | Single icon |

### Dock Appointments (`dock-yard/dock-appointments/pages/DockAppointmentsPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Appointment # | Flexible → 140px | `w-[140px]` |
| Type | Flexible → 100px | `w-[100px]` |
| Dock | Flexible → 100px | `w-[100px]` |
| Status | Flexible → 120px | `w-[120px]` |
| Start | Flexible → 150px | `w-[150px]` | DateTime |
| End | Flexible → 150px | `w-[150px]` | DateTime |
| Carrier | Flexible → 130px | `w-[130px]` |
| Driver | Flexible → 120px | `w-[120px]` |
| Actions | Flexible → 220px | `w-[220px]` | Text buttons |

### Work Orders (`work-orders/pages/WorkOrdersListPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Order # | Flexible → 120px | `w-[120px]` |
| Type | Flexible → 120px | `w-[120px]` |
| Status | Flexible → 120px | `w-[120px]` |
| Priority | Flexible → 100px | `w-[100px]` |
| Product | Flexible → 150px | `w-[150px]` |
| Qty | Flexible → 80px | `w-[80px]` |
| Client | Flexible → 130px | `w-[130px]` |
| Assigned To | Flexible → 130px | `w-[130px]` |
| Scheduled | Flexible → 110px | `w-[110px]` | Date only |
| Actions | Flexible → 180px | `w-[180px]` | View + status buttons |

### Invoices (`billing/pages/InvoicesPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Invoice | Flexible → 120px | `w-[120px]` |
| Client | Flexible → 180px | `w-[180px]` |
| Amount | Flexible → 120px | `w-[120px] text-right` |
| Period | Flexible → 170px | `w-[170px]` | Date range |
| Due | Flexible → 110px | `w-[110px]` | Date |
| Status | Flexible → 110px | `w-[110px]` |
| Actions | Flexible → 60px | `w-[60px]` | Single icon |

### Charges (`billing/pages/ChargesPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Type | Flexible → 120px | `w-[120px]` |
| Client | Flexible → 180px | `w-[180px]` |
| Qty | Flexible → 80px | `w-[80px] text-right` |
| Rate | Flexible → 100px | `w-[100px] text-right` |
| Amount | Flexible → 110px | `w-[110px] text-right` |
| Period Start | Flexible → 110px | `w-[110px]` |
| Period End | Flexible → 110px | `w-[110px]` |
| Status | Flexible → 100px | `w-[100px]` |

### Client Rates (Rate Master) (`billing/pages/ClientRatesPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Rate Code | Flexible → 120px | `w-[120px]` |
| Rate Name | Flexible → 200px | `w-[200px]` |
| Default Rate | Flexible → 110px | `w-[110px] text-right` |
| Type | Flexible → 100px | `w-[100px]` |
| Active | Flexible → 90px | `w-[90px]` |

### Billing Cycles (`billing/pages/BillingCyclesPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 120px | `w-[120px]` |
| Name | Flexible → 200px | `w-[200px]` |
| Frequency | Flexible → 120px | `w-[120px]` |
| Billing Day | Flexible → 100px | `w-[100px] text-right` |
| Facility | Flexible → 120px | `w-[120px]` |
| Active | Flexible → 90px | `w-[90px]` |

### Inventory Snapshots (`billing/pages/InventorySnapshotsPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Date | Flexible → 110px | `w-[110px]` |
| Client | Flexible → 180px | `w-[180px]` |
| Pallets | Flexible → 90px | `w-[90px] text-right` |
| Sq Ft | Flexible → 90px | `w-[90px] text-right` |
| Cu Ft | Flexible → 90px | `w-[90px] text-right` |
| Status | Flexible → 100px | `w-[100px]` |

### Inventory Reservations (`inventory-reservations/index.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Product | Flexible → 150px | `w-[150px]` |
| Location | Flexible → 140px | `w-[140px]` |
| Qty | Flexible → 90px | `w-[90px] text-right` |
| Type | Flexible → 120px | `w-[120px]` |
| Reference | Flexible → 150px | `w-[150px]` |
| Status | Flexible → 100px | `w-[100px]` |
| Actions | Flexible → 130px | `w-[130px]` | 3 icon buttons |

### VAS Services (`vas-catalog/pages/VasServicesPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 120px | `w-[120px]` |
| Name | Flexible → 200px | `w-[200px]` |
| Category | Flexible → 120px | `w-[120px]` |
| Default Rate | Flexible → 120px | `w-[120px] text-right` |
| UOM | Flexible → 80px | `w-[80px]` |
| Est. Time | Flexible → 110px | `w-[110px]` |
| Active | Flexible → 90px | `w-[90px]` |
| Actions | Flexible → 60px | `w-[60px]` | Single icon |

### Quality Inspections (`inspections/pages/InspectionListPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Inspection | Flexible → 120px | `w-[120px]` |
| Type | Flexible → 120px | `w-[120px]` |
| Status | Flexible → 120px | `w-[120px]` |
| Priority | Flexible → 100px | `w-[100px]` |
| Product | Flexible → 180px | `w-[180px]` |
| Assigned To | Flexible → 150px | `w-[150px]` |
| Scheduled | Flexible → 110px | `w-[110px]` |
| Actions | Flexible → 60px | `w-[60px]` |

### Replenishment — Suggestions Tab
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Product | Flexible → 220px | `w-[220px]` | Name + SKU subtitle |
| Pick Location | Flexible → 130px | `w-[130px]` |
| Current Qty | Flexible → 100px | `w-[100px] text-right` |
| Min / Max | Flexible → 100px | `w-[100px]` |
| Suggested | Flexible → 100px | `w-[100px] text-right` |
| Bulk Location | Flexible → 130px | `w-[130px]` |
| Actions | Flexible → 130px | `w-[130px]` | Text button |

### Replenishment — Active Tasks Tab
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Task ID | Flexible → 120px | `w-[120px]` | Truncated UUID |
| Product | Flexible → 200px | `w-[200px]` |
| From | Flexible → 130px | `w-[130px]` |
| To | Flexible → 130px | `w-[130px]` |
| Qty | Flexible → 90px | `w-[90px] text-right` |
| Priority | Flexible → 100px | `w-[100px]` |
| Status | Flexible → 110px | `w-[110px]` |
| Actions | Flexible → 200px | `w-[200px]` | Complete + Cancel buttons |

### Replenishment — History Tab
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Task ID | Flexible → 120px | `w-[120px]` |
| Product | Flexible → 200px | `w-[200px]` |
| From | Flexible → 130px | `w-[130px]` |
| To | Flexible → 130px | `w-[130px]` |
| Qty | Flexible → 90px | `w-[90px] text-right` |
| Status | Flexible → 110px | `w-[110px]` |
| Completed | Flexible → 110px | `w-[110px]` |

### Aisles (`warehouse/pages/AisleManagementPage.tsx`)
| Column | Current Width | Recommended |
|--------|-------------|-------------|
| Code | Flexible → 100px | `w-[100px]` |
| Zone | Flexible → 180px | `w-[180px]` |
| Status | Flexible → 100px | `w-[100px]` |
| Actions | Flexible → 100px | `w-[100px]` |

---

## Universal Rules Summary

| Field Type | Width | Alignment | Font | Example Pages |
|------------|-------|-----------|------|---------------|
| Expander/Checkbox | `w-[40px]` | center | — | POs, LPNs |
| Code/ID | `w-[120px]` | left | `font-mono text-xs` | All entity tables |
| Name/Title | `w-[200px]` | left | `text-sm font-medium` | Products, Clients |
| Description | `max-w-[200px] truncate` | left | `text-xs` | Products |
| Short Text/Enum | `w-[110px]` | left | `text-xs` | Type, Category, UOM |
| Quantity | `w-[90px]` | right | `font-mono text-sm` | Stock, Qty fields |
| Currency | `w-[120px]` | right | `font-mono text-sm` | Rates, Amounts |
| Date | `w-[110px]` | left | `text-xs` | Order dates, schedules |
| Date Range | `w-[170px]` | left | `text-xs` | Period, ranges |
| Status Badge | `w-[100px]` | left | — | All status fields |
| Priority Badge | `w-[100px]` | left | — | Priority fields |
| Location | `w-[140px]` | left | `font-mono text-xs` | Location, From/To |
| UUID (truncated) | `w-[120px]` | left | `font-mono text-xs` | Task IDs, reference IDs |
| Tracking Badges | `w-[130px]` | left | — | Product tracking |
| Actions (2 icons) | `w-[100px]` | right | — | Edit + Delete |
| Actions (3+ icons) | `w-[130px]` | right | — | Edit + Delete + Move |
| Actions (text btns) | `w-[200px]` | left | — | Check In, Complete |

## Implementation Approach

The recommended `w-[...]` Tailwind classes should be applied to **`<TableHead>`** elements as `className` props. For example:

```tsx
<TableHead className="w-[120px]">Code</TableHead>
<TableHead className="w-[200px]">Name</TableHead>
<TableHead className="w-[90px] text-right">Qty</TableHead>
<TableHead className="w-[100px]">Status</TableHead>
<TableHead className="w-[100px] text-right">Actions</TableHead>
```

For `@tanstack/react-table` based tables with `flexRender`, apply width through the column definition:

```tsx
{
  accessorKey: 'productName',
  header: ({ column }) => <DataTableColumnHeader column={column} title='Product' />,
  size: 200, // Preferred width
  minSize: 150,
  maxSize: 300,
}
```

This will maximize information density across all screens from 1280px to 2560px wide, preventing overly wide narrow columns and overly truncated wide ones.