# Enterprise Warehouse Management System (WMS) Web UI Architecture & Blueprint

**Document Purpose:** This document serves as a comprehensive architectural and UI/UX blueprint for building a modern, enterprise-grade Warehouse Management System (WMS) web application, heavily inspired by the paradigms established by **Manhattan Associates (WMOS / Active WM)**.

---

## 1. Core Architectural Concepts

Before designing the UI, the underlying data model must reflect standard WMS principles. The UI is merely a reflection of the system's hierarchical and domain-driven architecture.

*   **Multi-Tenancy & Domains:** The system supports multiple distinct companies or 3PL (Third-Party Logistics) clients under one umbrella.
*   **The LPN (License Plate Number):** The fundamental unit of tracking in a WMS. An LPN is a unique serial number attached to a physical container (tote, carton, pallet). The UI tracks inventory not just by SKU, but by the LPN that holds the SKU.
*   **Task Interleaving:** The system’s ability to assign a putaway task and a picking task to the same worker in a single trip to maximize efficiency. The UI must support mixed-task queues.

---

## 2. Authentication, Authorization & Domains

Enterprise WMS requires strict separation of duties and data access.

### 2.1 Authentication Levels
*   **SSO / LDAP Integration:** Web UI relies on enterprise identity providers (Okta, Azure AD) for login.
*   **Session Management:** Strict timeout policies due to the high-security nature of inventory.
*   **Device Fingerprinting:** Differentiating between a desktop supervisor and a mobile RF (Radio Frequency) scanner user.

### 2.2 Functional Security (Menu Security)
Defines *what a user can do*. Roles are grouped into functional trees:
*   **Supervisor:** Can release waves, adjust inventory, and manage labor.
*   **Clerk:** Can create ASNs (Advance Ship Notices) and print shipping labels.
*   **Viewer:** Read-only access to inventory and order dashboards.

### 2.3 Data Security (Domain Security)
Defines *what data a user can see*. This is critical for 3PLs.
*   **Facility Domains:** A user may be an "Admin" in the Dallas facility but have "No Access" to the Atlanta facility.
*   **UI Implementation:** The top-right global header features a **Facility Switcher**. Users can only switch between facilities they are explicitly granted domain access to.

---

## 3. Global UI Layout & Navigation

The modern WMS Web UI (like Manhattan Active) utilizes a **Single Page Application (SPA)** layout to prevent page reloads during high-paced warehouse operations.

### 3.1 The Layout Shell
1.  **Top Navigation Bar (Global Header):**
    *   **Left:** Hamburger menu (collapses side nav), Breadcrumbs.
    *   **Center:** Global Search (by LPN, Order #, SKU, or Employee ID).
    *   **Right:**
        *   **Context Switcher:** Current Facility, Current Zone.
        *   **Notifications:** Alerts for short-picks, dock door changes, or system errors.
        *   **User Profile:** Settings, UI density toggle, Log out.
2.  **Left Sidebar (The Menu Tree):**
    *   Organized by operational pillars (Inbound, Inventory, Outbound, Setup, Admin).
    *   Supports deep nesting but utilizes a "Favorites" or "Quick Links" pinning system for supervisors.
3.  **Main Workspace (The Content Area):**
    *   Features a persistent **Filter Bar** at the top.
    *   Below the filter bar is the **Data Grid** (Master view).
    *   Interacting with a grid row triggers a **Slide-out Drawer** (Detail view) to maintain context without navigating away.

---

## 4. Core UI Design Patterns

### 4.1 The Master-Detail Data Grid
*   **Columns:** Highly customizable. Users can drag, drop, and hide columns.
*   **Sticky Headers & Footers:** Footers display aggregated totals (e.g., "Total Expected Qty: 5,000").
*   **Inline Editing:** For quick changes (e.g., updating a carrier on an order).
*   **Bulk Actions:** Checkboxes on the left allow bulk release of orders or bulk printing of labels.

### 4.2 Dialogs vs. Slide-Out Drawers
*   **Modal Dialogs:** Used strictly for quick confirmations (e.g., "Are you sure you want to delete this Zone?") or short data entry.
*   **Slide-Out Drawers (Side Panels):** The core pattern for WMS. When a user clicks an ASN or a Wave, a panel slides in from the right containing tabs (e.g., *Header | Line Items | Receipts | History*). This allows the user to reference the main grid while editing details.

### 4.3 Wizards
Used for complex, multi-step setups that do not happen frequently:
*   **New Facility Setup Wizard:** Steps for defining Zones, Aisles, Bins, and Equipment.
*   **Wave Template Wizard:** Steps for defining order filtering rules, allocation logic, and print queues.

---

## 5. Master Data Management (The Foundation)

### 5.1 Facility & Spatial Management
The WMS must model the physical warehouse. The UI manages this via a strict **Node Tree Hierarchy**.
*   **Hierarchy:** Facility $\rightarrow$ Zone $\rightarrow$ Aisle $\rightarrow$ Bay $\rightarrow$ Level $\rightarrow$ Position (Bin).
*   **UI Screen - Spatial Explorer:** A split-screen view. Left side: Tree view of the warehouse. Right side: Visual heat-map or grid layout of the selected zone showing bin occupancy (e.g., Green = Empty, Red = Full, Yellow = Reserved).
*   **Attributes:** Each node has attributes (e.g., "Cold Storage", "Hazmat Approved", "Max Weight").

### 5.2 Item / SKU Management
*   **Item Master UI:**
    *   **Core Data:** SKU, UPC/EAN, Description, Brand.
    *   **Physical Attributes:** Length, Width, Height, Weight, Ti-Hi (Pallet configuration).
    *   **Velocity Codes:** A, B, C, D classifications to determine where the SKU should be slotted (fast movers near shipping docks).
*   **UOM (Unit of Measure) Hierarchy:** The UI must manage conversions.
    *   *Example:* 1 PLT (Pallet) = 40 CS (Cases) = 960 EA (Eaches).
    *   **UI Pattern:** A sub-grid on the Item Master showing UOM conversions and barcode associations for each UOM.
*   **Catch Weight Management:** For meat/produce, UI must capture both the *quantity* (1 box) and the *weight* (42.5 lbs).

---

## 6. Operational Workspaces

### 6.1 Inbound Operations
*   **ASN (Advance Ship Notice) Management:**
    *   **Screen:** List of expected deliveries.
    *   **Dialog:** ASN Creation Wizard (Vendor info, Expected arrival, PO matching).
*   **Receiving & Putaway Dashboard:**
    *   **UI View:** Dock Door Scheduler. A Gantt chart view showing which trucks are arriving at which doors and when.
    *   **Action:** "Blind Receipt" vs. "Directed Receipt" toggles.

### 6.2 Inventory & Replenishment
*   **Inventory Inquiry (The most used screen):**
    *   **Search:** By SKU, LPN, Lot, or Bin.
    *   **Grid:** Shows Available, Allocated, In-Transit, and Quarantined quantities.
*   **Replenishment Dashboard:**
    *   **UI View:** Alerts showing "Active Pick Faces" falling below minimum thresholds.
    *   **Action:** "Generate Replenishment Tasks" button, which triggers the system to create forklift tasks moving pallets from Reserve Storage to Forward Pick areas.
*   **Cycle Counting:**
    *   **Screen:** Generation of daily count sheets based on ABC velocity (Count 'A' items weekly, 'C' items annually).

### 6.3 Outbound Operations
*   **Wave Planning (The Supervisor's Cockpit):**
    *   **Concept:** Grouping hundreds of orders into a "Wave" to be released to the floor simultaneously.
    *   **UI View:** Split screen. Top: Unreleased Orders. Bottom: Wave Templates.
    *   **Action:** Drag-and-drop orders into waves. Visual indicators show if inventory is fully allocated to the wave.
*   **Picking & Packing Dashboards:**
    *   **UI View:** Real-time progress bars showing "Orders Picked vs. Orders Expected".
    *   **Exceptions Screen:** Highlights "Short Picks" (when a bin is empty) requiring supervisor intervention.
*   **Shipping & Load Building:**
    *   **Screen:** Visual load builder. A 3D or 2D representation of a truck trailer.
    *   **Action:** Dragging pallets onto the virtual trailer to ensure weight distribution and delivery stop sequence.

---

## 7. Labor Management & Analytics

*   **Task Interleaving Dashboard:**
    *   **UI View:** Shows workers currently active on the floor.
    *   **Analytics:** Graphs showing "Travel Time" vs. "Task Execution Time".
*   **User Task Queues:**
    *   Supervisors can view the queue of tasks assigned to specific users and manually override or reassign tasks via drag-and-drop.

---

# TECHNICAL DESIGN & PRD: Enterprise WMS (Manhattan Paradigm)

## PART 1: Core Relational Data Model (The Schema)
*The UI is just a reflection of the database. This is the exact schema required to support the UI.*

### 1.1 Facility & Spatial Schema
*   `facility` (facility_id, name, address, timezone, locale)
*   `zone` (zone_id, facility_id, name, type [Reserve/Pick/Staging/Dock], temp_controlled)
*   `location` (location_id, zone_id, aisle, bay, level, position, loc_type [Rack/Floor/Shelf], max_volume, max_weight, mix_sku_flag, mix_lot_flag, status [Active/Blocked/Full])

### 1.2 Item & SKU Schema
*   `item_master` (item_id, sku, upc, description, weight, length, width, height, ti, hi, class_id, velocity_code [A/B/C], catch_weight_flag)
*   `item_uom` (uom_id, item_id, uom_code [EA/CS/PLT], qty_per_parent_uom, barcode_value)
*   `item_lot` (lot_id, item_id, lot_number, mfg_date, exp_date, status)

### 1.3 Inventory & LPN Schema (The Heart of WMS)
*   `lpn_master` (lpn_id, facility_id, current_location_id, status [Expected/Received/Active/Allocated/Picked/Shipped/Empty], parent_lpn_id)
*   `lpn_detail` (lpn_detail_id, lpn_id, item_id, qty, lot_id, status, uom_code)
*   `inventory_snapshot` (item_id, location_id, lot_id, qty_on_hand, qty_allocated, qty_suspended, qty_available)

### 1.4 Inbound & Outbound Schema
*   `asn_header` (asn_id, facility_id, vendor_id, status, expected_date)
*   `asn_line` (asn_line_id, asn_id, item_id, qty_expected, qty_received)
*   `order_header` (order_id, facility_id, customer_id, order_type [SO/TO/RO], priority, status, carrier_id, ship_date)
*   `order_line` (order_line_id, order_id, item_id, qty_ordered, qty_allocated, qty_picked, qty_shipped)

### 1.5 Task & Execution Schema
*   `task_header` (task_id, task_type [Putaway/Pick/Replen/Move], priority, worker_id, equipment_id, status)
*   `task_detail` (task_detail_id, task_id, from_location_id, to_location_id, lpn_id, item_id, qty)

---

## PART 2: State Machines & Lifecycle Rules
*The UI must enforce these state transitions. Buttons/actions in the UI are enabled/disabled based on these states.*

### 2.1 Order Lifecycle
1.  **Created:** Order imported via EDI/API. (UI Action: *View, Cancel*)
2.  **Allocated:** Inventory is hard-allocated to the order. (UI Action: *View, Deallocate, Release to Wave*)
3.  **Releasing:** Order is added to a Wave and sent to the floor. (UI Action: *View, Force Cancel*)
4.  **Picking:** Tasks generated and assigned to RF scanners. (UI Action: *View, Reassign Task*)
5.  **Picked:** All lines confirmed picked. (UI Action: *View, Send to Packing*)
6.  **Packed:** Packed into shipping cartons, labels printed. (UI Action: *View, Print Manifest*)
7.  **Shipped:** Loaded on trailer, EDI 856 sent. (UI Action: *View Only*)

### 2.2 LPN (License Plate) Lifecycle
1.  **Expected:** ASN created. LPN barcode generated but not physically scanned.
2.  **Received:** Scanned at dock door. Inventory added to `inventory_snapshot`.
3.  **Putaway:** Directed to a location.
4.  **Active:** Sitting in a location, available for allocation.
5.  **Allocated:** Reserved for a specific order. Cannot be moved without reallocation.
6.  **Picked:** Scanned out of location during picking.

---

## PART 3: Screen-by-Screen UI Specifications
*This section details exactly what the frontend developer must build for the most critical screens.*

### 3.1 Global Layout & Navigation Shell
*   **Top Bar:** 
    *   `FacilityContextSwitcher`: Dropdown. Triggers global Redux state update. All subsequent API calls append `?facility_id={id}`.
    *   `GlobalSearch`: Debounced input (300ms). Searches `lpn_master.lpn_id`, `order_header.order_id`, `item_master.sku`. Returns a dropdown of results categorized by type.
*   **Left Sidebar:** 
    *   Accordion menu. Icons for: Inbound, Outbound, Inventory, Labor, Setup, Admin.
    *   State: Collapsed to icons only on screens < 1400px wide.

### 3.2 Screen: Order Management (Outbound)
*   **URL:** `/outbound/orders`
*   **Filter Bar (Top):** Order #, Customer, Status (Multi-select), Order Type, Priority, Ship Date Range.
*   **Data Grid (AG Grid Enterprise):**
    *   *Columns:* Order #, Customer, Status (Color-coded badge), Priority (1-5), Total Lines, Total Qty, Allocated %, Ship Date, Carrier.
    *   *Footer:* Sum of Total Qty, Sum of Allocated Qty.
*   **Row Actions (Context Menu on right-click or '...' button):**
    *   `Allocate`: Triggers backend allocation engine.
    *   `Deallocate`: Frees inventory.
    *   `Add to Wave`: Opens Wave Assignment Drawer.
    *   `Cancel`: Sets status to Cancelled.
*   **Detail Drawer (Slides from right, 60% width):**
    *   *Tab 1: Header:* Order details, shipping address, notes.
    *   *Tab 2: Lines:* Sub-grid of `order_line`. Columns: SKU, Desc, Ordered, Allocated, Picked, Shipped.
    *   *Tab 3: Allocations:* Sub-grid showing *which* LPNs and Locations are fulfilling this order.
    *   *Tab 4: History:* Audit log of status changes.

### 3.3 Screen: Wave Planning (The Supervisor Cockpit)
*   **URL:** `/outbound/waves`
*   **Layout:** Split screen. Top half is "Unreleased Orders Queue", Bottom half is "Active Waves".
*   **Wave Creation Dialog:**
    *   *Step 1: Template Selection:* Dropdown of Wave Templates (e.g., "LTL Multi-Order", "Parcel Single-Order").
    *   *Step 2: Filtering:* Auto-populates based on template. User can refine (e.g., Carrier = FedEx, Priority <= 2).
    *   *Step 3: Review:* Shows projected order count and total lines.
    *   *Action:* `Calculate & Create Wave`.
*   **Wave Execution Grid:**
    *   *Columns:* Wave ID, Template, Status [Created/Allocating/Releasing/Completed], Orders in Wave, Short-picks (Red badge if > 0).
    *   *Action:* `Release`. This triggers the backend to generate `task_header` records for picking.

### 3.4 Screen: Inventory & LPN Inquiry
*   **URL:** `/inventory/inquiry`
*   **Search Mode:** Toggle between "Search by SKU", "Search by LPN", "Search by Location".
*   **Grid View (If searching by SKU):**
    *   *Columns:* SKU, Location, LPN, Lot, Expiry Date, Qty on Hand, Qty Allocated, Qty Available, Status.
    *   *Grouping:* Group by Location.
*   **Detail Drawer:**
    *   *Tab 1: LPN Details:* Physical dimensions, weight, parent/child LPN hierarchy.
    *   *Tab 2: Movement History:* Chronological list of every task that touched this LPN (Received, Putaway, Picked).
    *   *Action:* `Adjust Qty` (Opens modal requiring supervisor PIN/password and reason code).
    *   *Action:* `Move LPN` (Opens modal to scan/select destination location).

### 3.5 Screen: Facility & Spatial Setup
*   **URL:** `/setup/facilities/spatial`
*   **Layout:** Left panel is a Tree View (Facility -> Zone -> Aisle). Right panel is the "Map".
*   **Map View:**
    *   Visual grid representing the selected Aisle.
    *   *Color Coding:* 
        *   White: Empty
        *   Green: Partially Full
        *   Red: Full
        *   Yellow: Blocked/Quarantined
    *   *Hover Tooltip:* Shows Location ID, Current LPN, SKU, Qty.
*   **Location Edit Dialog:**
    *   Fields: Max Volume, Max Weight, Mix SKU (Boolean), Mix Lot (Boolean), Pick Face (Boolean), Replenishment Min/Max thresholds.

---

## PART 4: Core Business Logic & Rules Engine
*The UI must expose the configuration of these rules. The backend executes them.*

### 4.1 Allocation Rules Engine
When an order is allocated, the system must find inventory. The UI allows supervisors to configure the priority of these rules:
1.  **Rule 1: Match Lot/Expiry:** If order requires specific lot, filter `inventory_snapshot` by lot.
2.  **Rule 2: Location Priority:** Prefer Forward Pick locations over Reserve locations to minimize travel.
3.  **Rule 3: Fulfillment Strategy:** 
    *   *Discrete:* Allocate one LPN to one order.
    *   *Batch:* Allocate one LPN to multiple orders (requires subsequent sort/pack step).
4.  **Rule 4: Consolidation:** If allocating multiple lines of the same order, try to find a single LPN that contains all items to minimize picks.

### 4.2 Directed Putaway Rules
When an LPN is received, the system suggests a destination.
1.  **Rule 1: Pre-assigned:** If the ASN specifies a location, use it.
2.  **Rule 2: Velocity Matching:** If SKU Velocity = 'A', find empty location in 'Forward Pick' zone.
3.  **Rule 3: Dimensional Fit:** Filter locations where `location.max_volume >= lpn.volume` and `location.max_weight >= lpn.weight`.
4.  **Rule 4: Proximity:** Find the closest empty location (by aisle/bay) to the receiving dock door.

### 4.3 Replenishment Logic
*   **Trigger:** `inventory_snapshot.qty_available` at a Forward Pick location drops below `replen_min`.
*   **Action:** System generates a Replenishment Task to move `replen_max - current_qty` from a Reserve location to the Forward Pick location.
*   **UI Representation:** The "Replenishment Dashboard" shows a gauge for every pick face. Green (>max), Yellow (between min/max), Red (<min).

---

## PART 5: RF / Mobile Scanner UI Specifications
*A WMS is not just web UI. 80% of execution happens on handheld RF scanners (Zebra/Motorola). This UI must be built as a separate, highly optimized mobile web app or native wrapper.*

### 5.1 Design Principles for RF UI
*   **No Mouse:** Everything must be navigable via D-pad (Up, Down, Left, Right, Enter, Esc).
*   **Barcode Focus:** Every screen must have a persistent, hidden text input that auto-focuses. When a barcode is scanned, it auto-submits.
*   **High Contrast:** Large fonts (minimum 18px), black text on white/yellow backgrounds for visibility in dim warehouses.
*   **Audio Feedback:** Success beep (high pitch), Error buzz (low pitch).

### 5.2 Screen Flow: Receiving
1.  **Menu Screen:** Grid of large buttons (Receive, Putaway, Pick, Pack, etc.).
2.  **Receive PO:** Prompt: "Scan PO Label" -> "Scan Item" -> "Scan Qty" -> "Scan LPN" -> Confirm.
3.  **UI Elements:** 
    *   Top bar: Current User, Facility.
    *   Main area: Large text showing "Expected: 100", "Scanned: 45".
    *   Bottom bar: `F1: Help`, `F2: Clear`, `F3: Finish`, `F12: Exit`.

---

## PART 6: API & Integration Architecture

### 6.1 Frontend to Backend (REST/GraphQL)
*   **Pattern:** The Web UI should use **GraphQL** for complex screens (like Order Detail) to fetch nested data (Order -> Lines -> Allocations -> LPNs) in a single request, preventing waterfall API calls.
*   **Mutations:** Use standard REST POST/PUT for state changes (e.g., `POST /api/v1/orders/{id}/allocate`).

### 6.2 External Integrations (EDI & APIs)
The UI must include an "Integration Monitor" screen.
*   **Inbound:** 
    *   EDI 850 (Purchase Order) -> Maps to `order_header`.
    *   EDI 856 (Advance Ship Notice) -> Maps to `asn_header`.
*   **Outbound:**
    *   EDI 856 (Ship Notice/Manifest) -> Generated upon shipment.
    *   EDI 945 (Warehouse Shipping Advice) -> Sent to ERP.
*   **UI Monitor:** A dashboard showing a timeline of EDI transactions. Color-coded: Green (Success), Yellow (Pending/Retry), Red (Failed). Clicking a failed transaction opens a JSON viewer to see the raw payload and the error message.

