# AGENTS.md — WMS Frontend Build Instructions

## Project Overview

**This is a frontend-only project.** Build the UI for a multi-tenant SaaS Warehouse Management System (WMS). The WMS backend (`new-wmsbackend`) is already built and fully operational — all APIs are exposed and ready. We are building ONLY the frontend that consumes those APIs.

Tenants log in by entering their **Tenant ID**, **username**, and **password**. Authentication is handled by **SaaS Core** (a separate SaaS management platform running on port **3001**). The WMS backend runs on port **3002** and verifies JWTs issued by SaaS Core.

The frontend lives in `new-wmsfrontend/` (currently only has `API/` and `docs/`). A reference dashboard shell is in `next-shadcn-admin-dashboard/` — do NOT modify it, only read from it.

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | ^19.2.5 |
| Language | TypeScript | ~6.0.3 |
| Build Tool | Vite | ^8.0.8 |
| Package Manager | pnpm | — |
| Routing | TanStack Router (file-based) | ^1.168.22 |
| Server State | TanStack React Query | ^5.99.0 |
| Client State | Zustand | ^5.0.12 |
| UI Library | shadcn/ui (Radix primitives, New York style) | — |
| Styling | Tailwind CSS v4 | ^4.2.2 |
| Forms | React Hook Form + Zod | ^7.72.1 / ^4.3.6 |
| HTTP Client | Axios | ^1.15.0 |
| Tables | TanStack React Table | ^8.21.3 |
| Auth | Custom JWT (via SaaS Core) | — |
| Charts | Recharts | ^3.8.1 |
| Icons | Lucide React + Radix Icons | ^1.8.0 / ^1.3.2 |
| Testing | Vitest + Playwright | ^4.1.4 |
| Linting | ESLint v10 + typescript-eslint | ^10.2.1 |
| Formatting | Prettier v3 | ^3.8.3 |
| Dead Code | Knip | ^6.4.1 |
| Notifications | sonner | ^2.x |
| Barcode | jsbarcode | — |
| OTP | input-otp | — |
| Loading Bar | react-top-loading-bar | — |
| Date | date-fns, react-day-picker | — |

NODE version is 22 and above.

**Path alias:** `@/` -> `./src/` (in both `tsconfig.json` and `vite.config.ts`).

---

## 2. Project Structure

```
new-wmsfrontend/
├── src/
│   ├── assets/                  # SVG icons (brand, custom, logos)
│   ├── components/
│   │   ├── common/
│   │   │   ├── dialogs/         # Reusable dialog wrappers
│   │   │   └── forms/           # Domain-aware form controls
│   │   ├── data-table/          # Reusable TanStack Table building blocks
│   │   ├── layout/              # App shell: sidebar, header, nav, facility selector
│   │   ├── status-badges/       # Status badge components
│   │   ├── ui/                  # shadcn/ui primitives (copy from reference project)
│   │   └── wizard/              # Stepper/multi-step dialog framework
│   ├── config/                  # App configuration (fonts, etc.)
│   ├── context/                 # React Context providers (auth, theme, layout, facility, etc.)
│   ├── features/                # Domain feature modules
│   ├── hooks/                   # Shared custom hooks
│   ├── lib/
│   │   ├── api/
│   │   │   ├── wms-api/         # Wrappers around generated WMS API functions
│   │   │   └── wms-saas-core-api/ # Wrappers around generated SaaS Core API functions
│   │   ├── http/                # Re-exports for httpClient/httpSaasClient
│   │   └── types/               # Generated + hand-curated TypeScript types
│   │   ├── cookies.ts           # Cookie utilities
│   │   ├── handle-server-error.ts
│   │   ├── httpClient.ts        # Axios for WMS backend (port 3002)
│   │   ├── httpSaasClient.ts    # Axios for SaaS Core backend (port 3000)
│   │   ├── queryClient.ts       # React Query client config
│   │   └── utils.ts             # cn(), safeArray(), safeTotal(), sleep(), etc.
│   ├── routes/                  # TanStack Router file-based route tree
│   ├── stores/                  # Zustand stores
│   ├── styles/                  # Global CSS (Tailwind, theme variables, animations)
│   ├── test-utils/              # Test setup utilities
│   ├── types/                   # App-level type declarations
│   ├── main.tsx                 # Entry point with provider nesting
│   └── routeTree.gen.ts         # Auto-generated route tree
├── API/                         # Orval-generated API clients
│   ├── wms-core-lib/            # WMS API (port 3002)
│   │   ├── api/wms-api/         # 97 generated API directories
│   │   ├── http/httpClient.ts
│   │   ├── queryClient.ts
│   │   └── types/
│   └── saas-core-lib/           # SaaS Core API (port 3000)
│       ├── api/wms-saas-core-api/
│       ├── http/httpClient.ts
│       ├── queryClient.ts
│       └── types/
└── docs/                        # Documentation (read-only)
```

---

## 3. How to Use the Reference Project

The reference project is at `../next-shadcn-admin-dashboard/`. DO NOT modify it. Read from it to understand patterns:

### 3.1 UI Components to Copy
- Copy all files from `next-shadcn-admin-dashboard/src/components/ui/` into `new-wmsfrontend/src/components/ui/`. These are shadcn/ui primitives (60 components: button, dialog, sidebar, table, select, etc.).
- The reference uses `radix-nova` style with CVA (class-variance-authority) and `cn()` utility.
- Components use `data-slot` attributes for test/tooling targeting.
- The `sidebar.tsx` in reference has `SidebarProvider`, `Sidebar`, `SidebarInset`, `NavGroup`, `NavUser`, `TeamSwitcher`, `FilterSidebar` — reuse this app shell structure.

### 3.2 Layout Components to Replicate
- The reference project's layout pattern: sidebar with three collapsible modes (`offcanvas`, `icon`, `none`) and three layout variants (`inset`, `sidebar`, `floating`).
- Header with scroll-aware shadow/backdrop.
- `Main` content wrapper with fixed/fluid modes.
- Layout preferences persisted in cookies.

### 3.3 Theme System
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (no `tailwind.config.js` needed).
- CSS variables in OKLCH color space for light/dark themes.
- `ThemeProvider` with dark/light/system toggle, cookie-persisted.
- Font system from `src/config/fonts.ts`.
- RTL support via `DirectionProvider` (Radix).
- Animations via `tw-animate-css` plugin + custom keyframes.

### 3.4 NOT to Copy from Reference
- The reference is Next.js-based; this project is Vite + React. Do NOT copy `next.config.mjs`, `postcss.config.mjs`, or any Next.js-specific patterns.
- Do NOT copy the `AGENTS.md` from the reference (it's specific to that project).

---

## 4. API Client Layer

### 4.1 Two Backends

| Client | Backend | Base URL | Env Var |
|---|---|---|---|
| `httpClient.ts` | WMS API (already built, port **3002**) | `http://localhost:3002/api/v1/wms` | `VITE_API_BASE_URL` |
| `httpSaasClient.ts` | SaaS Core API (auth only, port **3001**) | `http://localhost:3001/api/v1` | `VITE_SAAS_API_BASE_URL` |

### 4.2 HTTP Client Patterns (from `API/*-core-lib/http/httpClient.ts`)
- **Request interceptor:** Attaches `Authorization: Bearer {token}` and `X-Tenant-Code` header from localStorage.
- **Response interceptor:** On 401, clears auth and redirects to `/login`.
- Both clients follow the same pattern. Use `customInstance<T>(config)` for type-safe requests.

### 4.3 Generated API Wrappers
The `API/wms-core-lib/api/wms-api/` directory contains ~97 generated API directories (one per domain tag). Each contains generated TypeScript functions. Import them into `src/lib/api/wms-api/` with clean re-exports.

**Pattern for feature data files:**
```ts
// src/features/brands/data/brand-queries.ts
import { BrandWebController_findAll } from '@/lib/api/wms-api/wms-web/wms-web'

export function useBrands() {
  return useQuery({
    queryKey: ['wms', 'brands', 'list'],
    queryFn: () => BrandWebController_findAll(),
    select: (data) => ({
      brands: safeArray<Brand>(data),
      total: safeTotal(data),
    }),
  })
}
```

### 4.4 SaaS Core Usage
Use SaaS Core API (port **3001**) for auth-related operations only. The login flow sends **tenant ID + username + password**:
- Login: `POST /api/v1/auth/login` (body: `{ tenantId, username, password }`)
- Token refresh
- User profile: `GET /api/v1/users/me`
- Logout: `POST /api/v1/auth/logout`

The SaaS Core handles tenant management, role/permission definitions, license/quota management. The UI for these is NOT in scope — only use the auth endpoints. All WMS operations go to the WMS backend on port **3002**.

---

## 5. Authentication & Authorization

### 5.1 Auth Flow
1. User logs in via SaaS Core (port **3001**) `POST /api/v1/auth/login` with `{ tenantId, username, password }` — NOT the WMS backend.
2. WMS backend (port **3002**) only verifies JWTs issued by SaaS Core — all WMS APIs are already built and ready.
3. Store tokens in localStorage: `auth_token`, `refresh_token`, `tenant_code`, `user_info`.
4. Axios interceptors attach `Authorization: Bearer` + `X-Tenant-Code` to every request.
5. On 401, attempt token refresh. If refresh fails, redirect to `/login`.

### 5.2 Auth State
- `AuthContext` provides: `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `refreshToken`.
- `AuthStore` (Zustand): manages secondary access token synced to cookie.
- JWT payload includes: `sub`, `tenantId`, `tenantCode`, `tenantStatus`, `roles`, `permissions`, `jti`.

### 5.3 Route Protection
- `_authenticated/route.tsx`: `beforeLoad` checks `auth.isAuthenticated`, redirects to `/login`.
- `ProtectedRoute` component: shows spinner during loading, redirects when not authenticated.
- Public routes in `(auth)/` group: login, sign-up, forgot-password, OTP.

### 5.4 Roles & Permissions
7 WMS roles defined in backend:
- `WAREHOUSE_ADMIN`, `WAREHOUSE_SUPERVISOR`, `WAREHOUSE_OPERATOR`, `SYSTEM_ADMIN`, `SCANNER_USER`, `INVENTORY_CLERK`, `TENANT_ADMIN`
- Sidebar navigation items include optional `roles[]` arrays for filtering.
- Use `filterSidebar()` utility to filter nav by user roles.
- 86 CASL subjects + 31 actions — map these to UI-level permission checks.

---

## 6. Routing Architecture (TanStack Router, File-Based)

### 6.1 Route Structure
```
src/routes/
├── __root.tsx                   # Root layout: NavigationProgress, Outlet, Toaster, DevTools
├── index.tsx                    # / redirect
├── (auth)/                      # Public auth routes
│   ├── login.tsx
│   └── ...
├── _authenticated/              # All protected routes (beforeLoad auth check)
│   ├── route.tsx                # Layout: AuthenticatedLayout + ProtectedRoute
│   ├── index.tsx                # Dashboard
│   ├── inbound/
│   │   ├── asns.tsx
│   │   ├── receiving.tsx
│   │   ├── putaway.tsx
│   │   └── ...
│   ├── inventory/
│   │   ├── on-hand.tsx
│   │   ├── adjustments.tsx
│   │   ├── cycle-counts.tsx
│   │   └── ...
│   ├── outbound/
│   │   ├── sales-orders.tsx
│   │   ├── waves.tsx
│   │   ├── picking.tsx
│   │   ├── packing.tsx
│   │   ├── staging.tsx
│   │   └── shipping.tsx
│   ├── master-data/
│   │   ├── products.tsx
│   │   ├── clients.tsx
│   │   ├── vendors.tsx
│   │   └── ...
│   ├── warehouse/
│   │   ├── facilities.tsx
│   │   ├── locations.tsx
│   │   └── zones.tsx
│   ├── quality/
│   │   └── inspections.tsx
│   ├── labor/
│   │   ├── shifts.tsx
│   │   └── time-tracking.tsx
│   ├── equipment/
│   │   └── index.tsx
│   ├── dock-yard/
│   │   └── appointments.tsx
│   ├── exceptions/
│   │   └── index.tsx
│   ├── billing/
│   │   └── invoices.tsx
│   ├── analytics/
│   │   └── dashboard.tsx
│   ├── settings/
│   │   └── index.tsx
│   └── reports/
│       └── index.tsx
└── (errors)/                    # Error pages (401, 403, 404, 500, 503)
```

### 6.2 Route Configuration
- `createRouter` in `main.tsx` with `defaultPreload: 'intent'`.
- Root route uses `createRootRouteWithContext<{ queryClient, auth }>()`.
- Auto code-splitting: `tanstackRouter({ autoCodeSplitting: true })` in Vite config.
- DevTools in dev mode: `TanStackRouterDevtools` (bottom-right), `ReactQueryDevtools` (bottom-left).

---

## 7. State Management

### 7.1 Server State: TanStack React Query
- `queryClient` with `staleTime: 5 min`, `retry: 1`, `refetchOnWindowFocus: false`.
- Each feature defines query/mutation hooks in a data file (e.g., `features/brands/data/brand-queries.ts`).
- Query keys pattern: `['wms', 'domain', 'entity', action]`.
- Mutations invalidate related queries on `onSuccess`.
- `safeArray()` helper handles various API response shapes (plain array, `{ items: [] }`, `{ data: [] }`).

### 7.2 Client State: Zustand
- `auth-store.ts` — user, access token (cookie-synced).
- `facility-store.ts` — selected facility (context-switcher state).
- Keep lightweight — React Query handles server data.

### 7.3 Context Providers (in `main.tsx`)
```
QueryClientProvider
  └─ AuthProvider
      └─ FacilityProvider
          └─ ThemeProvider
              └─ FontProvider
                  └─ DirectionProvider (Radix)
                      └─ TooltipProvider
                          └─ ErrorBoundary
                              └─ InnerApp (RouterProvider)
```

---

## 8. UI Component Architecture

### 8.1 shadcn/ui Pattern
- All UI primitives use `class-variance-authority` (CVA) for variant-based styling.
- `cn()` utility from `clsx` + `tailwind-merge`.
- `asChild` prop via `@radix-ui/react-slot` for polymorphic composition.
- shadcn/ui config: style `new-york`, CSS variables enabled, icons `lucide`.

### 8.2 Radix Primitives Installed
AlertDialog, Avatar, Checkbox, Collapsible, Dialog, Direction, DropdownMenu, Icons, Label, Popover, RadioGroup, ScrollArea, Select, Separator, Slot, Switch, Tabs, Tooltip.

### 8.3 Common UI Building Blocks (build these)

#### Dialogs (in `src/components/common/dialogs/`)
- `ConfirmDialog` — AlertDialog-based confirmation with loading state and destructive styling.
- `CreateEntityDialog` — Dialog with title, description, form slot, submit/cancel.
- `DetailDialog` — Read-only detail view dialog.
- `EditEntityDialog` — Edit-mode dialog wrapper.
- `SubmitForApprovalDialog` — Approval submission dialog.
- `OverrideAllocationDialog` — Allocation override dialog.

#### Form Controls (in `src/components/common/forms/`)
Domain-aware form components that integrate with React Hook Form `FormField`:
- `ProductSelect`, `FacilitySelect`, `LocationSelect`, `UserSelect`, `ZoneSelect`
- `PrioritySelect`, `StatusSelect`, `TransferTypeSelect`, `FormatSelect`, `ReportTypeSelect`
- `CountMethodSelect`, `RoleSelect`, `VelocityClassSelect`, `ProductCategorySelect`, `UomSelect`, `ReasonSelect`
- `DateRangePicker`, `ExpiryDatePicker`
- `LotNumberInput`, `QuantityInput`, `NameInput`, `CodeInput`, `NotesTextarea`, `DescriptionTextarea`

Each follows: accept `control` + `name` from `useForm`, render `FormField` → `FormItem` → `FormLabel` → `Select`/`Input` → `FormMessage`, fetch data via React Query internally.

#### Wizard / Stepper (in `src/components/wizard/`)
- `StepperDialog` — Multi-step dialog with visual progress indicator, Back/Next/Submit navigation, `onBeforeNext` async validation hook.
- `Step` interface: `id`, `title`, `description?`, `icon?`.

#### Data Table Components (in `src/components/data-table/`)
- `DataTableColumnHeader` — Sortable column header with ascending/descending/hide menu.
- `DataTableToolbar` — Search input + faceted filters + reset + view options.
- `DataTablePagination` — Page nav with page numbers, first/last, page size selector.
- `DataTableFacetedFilter` — Multi-select filter UI with checkboxes and counts.
- `DataTableViewOptions` — Column visibility toggle dropdown.
- `DataTableBulkActions` — Floating action bar for selected rows.

#### Other Components
- `CommandMenu` — `cmdk`-based command palette (`⌘K` shortcut).
- `NavigationProgress` — `react-top-loading-bar` for route transitions.
- `ThemeSwitch` — Dark/light/system toggle.
- `Search` — Search button with keyboard shortcut badge.
- `ErrorBoundary` — React error boundary.
- `ProtectedRoute` — Auth gate.
- `LongText` — Text truncation.
- `PasswordInput` — Input with show/hide toggle.
- `StatusTimeline` — Vertical timeline for status changes.
- `Barcode` — `jsbarcode` integration.
- `LoadingSkeleton` — Skeleton loading placeholders.

### 8.4 Status Badge System
`src/components/status-badges/StatusBadges.tsx` — Centralized mapping of domain status values to badge variants with color coding. Must handle ALL status enums from the backend (41 enums).

---

## 9. WMS-Specific UI Patterns (from UI-WMSGuide.md)

### 9.1 Core Design Principles
- **Master-Detail Data Grid:** Columns customizable, sticky headers/footers with aggregated totals, inline editing, bulk actions via checkboxes.
- **Slide-Out Drawers (Side Panels):** Core pattern for WMS. Clicking a row opens a drawer from the right with tabs (Header | Lines | History | etc.). This maintains context on the main grid.
- **Modal Dialogs:** Only for quick confirmations or short data entry.
- **Wizards:** For complex multi-step setups (New Facility, Wave Template, etc.).

### 9.2 Global Layout Shell
- **Top Bar:** Left: hamburger + breadcrumbs. Center: Global Search (by LPN, Order #, SKU). Right: Facility Switcher, Notifications, User Profile.
- **Left Sidebar:** Organized by operational pillars (Inbound, Inventory, Outbound, Setup, Admin). Supports deep nesting with "Favorites" pinning.
- **Main Workspace:** Filter bar at top → Data Grid (Master) → Slide-out Drawer (Detail).

### 9.3 Facility Switcher
Essential WMS concept. Users can be "Admin" in one facility but "No Access" in another. Place in top-right header as a `FacilitySelector` popover/command-based switcher. All subsequent API calls scoped to selected facility.

### 9.4 Key Screens to Build (by domain)

#### Dashboard
KPI cards: ASNs received, GRNs created, orders shipped, picking tasks completed, inventory accuracy %, defect rate %, fill rate %, units per labor hour. Charts via Recharts. Pick heatmap visualization.

#### Inbound
- **ASN Management:** List of expected deliveries, ASN Creation Wizard (Vendor, Expected arrival, PO matching), Dock Door Scheduler (Gantt chart view).
- **Receiving:** Door assignment, scan PO/ASN/LPN, blind receiving toggle, variance approval, damage codes.
- **Putaway:** Task list, system-directed location suggestion, location-full exception, damage reporting.

#### Inventory
- **On-Hand Inquiry:** Most-used screen. Search by SKU, LPN, Lot, or Location. Shows Available/Allocated/In-Transit/Quarantined quantities. Group by Location.
- **Adjustments:** Create with reason code, approval workflow, supervisor PIN override.
- **Cycle Counts:** Count sheets generation by ABC velocity, blind count, variance detection, recount, supervisor review, root cause.
- **LPN Inquiry:** Detail drawer with LPN hierarchy, movement history, adjust qty, move LPN actions.

#### Outbound
- **Sales Orders:** List with filter bar (Order #, Customer, Status, Type, Priority, Ship Date). Detail drawer with Header/Lines/Allocations/History tabs. Actions: Allocate, Deallocate, Add to Wave, Cancel.
- **Wave Planning (Supervisor Cockpit):** Split screen — Unreleased Orders (top) + Active Waves (bottom). Wave Creation Wizard (Template → Filtering → Review → Create). Wave Execution Grid with Release action.
- **Picking:** Task list, cluster/batch/case/pallet pick modes, short-pick handling, route optimization display.
- **Packing:** Station assignment, cartonization, weight capture, label printing, exception handling.
- **Staging:** Lane assignment, scan carton → lane, undo stage, lane contents view.
- **Shipping:** Load building, trailer management, multi-stop sequencing, carrier handoff, BOL/manifest, force-close.

#### Master Data
- **Products:** SKU/UPC, physical attributes, velocity codes (A/B/C/D), UOM hierarchy conversion (PLT → CS → EA), packaging, barcodes, supplier assignments, client assignments.
- **Facility/Spatial:** Tree view (Facility → Zone → Aisle → Bay → Level → Position), visual heat-map grid showing bin occupancy.
- **Clients/Vendors/Carriers:** Standard CRUD with address/contact management.

#### Quality
- Inspections with profile-based checklists, defect codes, lot/expiry/temp validation, supervisor review.
- NCRs, compliance audits, hazmat materials.

#### Labor
- Shifts, time logs, performance metrics, clock-in/out tracking.

#### Equipment
- Equipment CRUD, check-out/check-in, maintenance scheduling.

#### Dock-Yard
- Appointment scheduling, yard vehicle tracking, dock door assignment.

#### Exceptions
- Cross-cutting exception tracking with severity, escalation rules, comments threading.

#### Billing
- Storage rates, client rates, billing cycles, charge calculation, invoice generation.

#### Analytics & Reports
- Pick heatmap, daily KPIs, async report generation (queue-based).

---

## 10. Form Handling

### 10.1 Stack
- `react-hook-form` v7 with TypeScript generics.
- Zod schema validation via `@hookform/resolvers/zod`.
- shadcn/ui Form components (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`).

### 10.2 Pattern
```ts
const schema = z.object({
  brandCode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  isActive: z.boolean().optional().default(true),
})

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})
```

---

## 11. Data Table System

### 11.1 URL State Sync
`useTableUrlState` hook syncs pagination + global filter with URL query parameters:
```ts
const tableUrlState = useTableUrlState({
  search, navigate,
  pagination: { defaultPage: 1, defaultPageSize: 10 },
  globalFilter: { enabled: true, key: 'q' },
})
```

### 11.2 Server-Side vs Client-Side
- Use server-side pagination/sorting/filtering for large datasets (all operational tables).
- Use client-side for small reference data (UOMs, carriers, etc.).
- Server-side: pass pagination/filter state to API query params.

---

## 12. WMS API Domain Mapping

The backend has ~430 web endpoints across 74 controllers. Below is the mapping of domains to file directories in `API/wms-core-lib/api/wms-api/`:

| Domain | API Directory | Key Controllers |
|---|---|---|
| Master Data | `products/`, `product-brands/`, `product-categories/`, `clients/`, `vendors/`, `carriers/`, `units-of-measure/` | CRUD for all entities |
| Warehouse Structure | `warehouse-facilities/`, `warehouse-zones/`, `warehouse-structure/`, `storage-locations/` | Facility/zone/location CRUD |
| Inbound | `advance-ship-notices/`, `purchase-orders/`, `goods-receipt/`, `putaway/`, `putaway-rules/`, `customer-returns/`, `damage-code-web/`, `receiving-approval-web/`, `receiving-tolerance-web/`, `location-exception-web/`, `web-inbound-trailers/` | Full inbound lifecycle |
| Outbound | `outbound-sales-orders/`, `outbound-allocation/`, `outbound-picking-waves/`, `outbound-picking-tasks/`, `outbound-packing/`, `outbound-shipments/`, `outbound-loads/`, `outbound-backorders/`, `outbound-cross-dock/`, `outbound-carrier-rates/`, `outbound-replenishment-rules/`, `outbound-vas-catalog/`, `outbound-vas-execution/`, `outbound-pick-audit/`, `outbound-pick-routes/`, `outbound-wave-tasks/`, `staging-web/`, `trailer-web/` | Full outbound lifecycle |
| Inventory | `inventory/`, `outbound-allocation/` | On-hand, lots, LPNs, adjustments, allocations, holds, transfers |
| Quality | `inspection-web/`, `inspection-profile-web/`, `defect-code-web/`, `quality/` | Inspections, profiles, defects |
| Billing | `billing/` | Storage rates, charges, invoices |
| Equipment | `equipment/`, `equipment-maintenance/` | CRUD + maintenance |
| Labor | `labor-shifts/`, `labor-time-tracking/`, `labor-performance/` | Shifts, time logs, metrics |
| Transfers | `transfers/` | Transfer CRUD + dispatch/receive |
| Work Orders | `work-orders/` | Work order CRUD + operations |
| Dock Yard | `dock-yard/` | Appointments, yard vehicles |
| Exceptions | `exception-management/`, `exception-escalation-rules/` | Exceptions + escalation |
| Settings | `settings/` | System settings |
| Workflow | `workflow-bpmn-processes/`, `workflow-state-machines/`, `workflow-rules/`, `workflow-executions/` | BPMN, state machines, rules |
| Integrations | `integrations/` | Webhooks, entity-mappings |
| Reports | `reports/` | Report generation |
| Analytics | `analytics-heatmap/`, `analytics-kpi/` | Heatmap + KPIs |
| Observability | `observability/` | Events, audit logs |
| Security | `security/` | Supervisor PIN |
| Health | `health/` | Health check |

---

## 13. Key Implementation Conventions

### 13.1 Feature Module Pattern
```
src/features/<domain>/
├── components/               # Domain-specific components
├── data/
│   └── <entity>-queries.ts   # React Query hooks (useXxx, useCreateXxx, etc.)
├── schemas/                  # Zod schemas for forms
├── types/                    # Domain-specific types
└── index.ts                  # Public exports
```

### 13.2 Query/Mutation Hook Pattern
```ts
// data/brand-queries.ts
export function useBrands(params?: BrandControllerFindAllParams) {
  return useQuery({
    queryKey: ['wms', 'brands', 'list', params],
    queryFn: () => BrandWebController_findAll(params),
    select: (data) => ({ brands: safeArray<Brand>(data), total: safeTotal(data) }),
  })
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ['wms', 'brands', id],
    queryFn: () => BrandWebController_get(id),
    enabled: !!id,
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBrandDto) => BrandWebController_create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wms', 'brands'] })
      toast.success('Brand created')
    },
    onError: (error) => handleServerError(error),
  })
}
```

### 13.3 Page Component Pattern
```tsx
// routes/_authenticated/brands.tsx
export function Route() {
  return <BrandsPage />
}

function BrandsPage() {
  const { data, isLoading, error } = useBrands()
  const [openDialog, setOpenDialog] = useState(false)

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} onRetry={() => {}} />

  return (
    <div className="space-y-4">
      <PageHeader title="Brands" onAdd={() => setOpenDialog(true)} />
      <Card>
        <DataTableToolbar table={table} />
        <DataTable table={table} columns={columns} />
        <DataTablePagination table={table} />
      </Card>
      <CreateEntityDialog open={openDialog} onOpenChange={setOpenDialog}>
        <BrandForm onSubmit={handleCreate} />
      </CreateEntityDialog>
    </div>
  )
}
```

### 13.4 Slide-Out Drawer Pattern
For detail views in operational screens:
```tsx
<Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Order #{orderId}</DrawerTitle>
    </DrawerHeader>
    <Tabs defaultValue="header">
      <TabsList>
        <TabsTrigger value="header">Header</TabsTrigger>
        <TabsTrigger value="lines">Lines</TabsTrigger>
        <TabsTrigger value="allocations">Allocations</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="header">...</TabsContent>
      <TabsContent value="lines">
        <DataTable data={lines} columns={lineColumns} />
      </TabsContent>
      ...
    </Tabs>
  </DrawerContent>
</Drawer>
```

### 13.5 Status Badge Mapping
Each domain's status enum needs color-coded badge variants:
```ts
const statusConfig = {
  'CREATED': { variant: 'outline' },
  'IN_PROGRESS': { variant: 'warning' },
  'COMPLETED': { variant: 'success' },
  'CANCELLED': { variant: 'destructive' },
  'ON_HOLD': { variant: 'secondary' },
  // ... all 41 enums mapped
}
```

---

## 14. Build & Development Commands

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (Vite)
pnpm build                      # Production build
pnpm lint                       # ESLint check
pnpm format                     # Prettier format
pnpm test                       # Run tests (Vitest + Playwright)
pnpm test:watch                 # Watch mode
pnpm test:ui                    # Vitest UI dashboard
pnpm test:coverage              # Coverage report
pnpm typecheck                  # TypeScript check
pnpm knip                       # Dead code analysis
```

### Environment Variables (`.env`)
```
VITE_API_BASE_URL=http://localhost:3002    # WMS backend (already built)
VITE_SAAS_API_BASE_URL=http://localhost:3001  # SaaS Core (auth only)
```

### Vite Plugins (in `vite.config.ts`)
1. `@tanstack/router-plugin/vite` — Route tree generation + auto code-splitting
2. `@vitejs/plugin-react` — React Fast Refresh
3. `@tailwindcss/vite` — Tailwind CSS v4

### ESLint Configuration
- `no-console: error` — no console.log in production
- `consistent-type-imports` — enforce `import type` with inline fix
- `no-unused-vars` with `_` prefix allowance
- Ignores: `dist`, `src/components/ui`, `generated-*` directories

### Prettier Configuration
- `semi: false`, `singleQuote: true`, `jsxSingleQuote: true`
- `trailingComma: 'es5'`, `printWidth: 80`
- Import order groups (16 groups) with `@trivago/prettier-plugin-sort-imports`
- Tailwind class sorting via `prettier-plugin-tailwindcss`

---

## 15. Build Order (Recommended)

### Phase 1: Scaffold & Shell
1. Initialize Vite + React + TypeScript project with pnpm
2. Install all dependencies from TECH_CAPABILITY.md
3. Copy shadcn/ui primitives from reference project to `src/components/ui/`
4. Set up project structure (directories per section 2)
5. Configure Vite (plugins, path alias), ESLint, Prettier, TypeScript
6. Build layout shell: Sidebar, Header, Main, FacilitySelector
7. Set up routing with TanStack Router (auth group + authenticated group)
8. Implement auth: AuthProvider, AuthStore, login/logout pages, ProtectedRoute
9. Set up HTTP clients (httpClient.ts, httpSaasClient.ts), interceptors, queryClient
10. Set up ThemeProvider, FontProvider, DirectionProvider

### Phase 2: Foundation Components
11. Build common dialogs (ConfirmDialog, CreateEntityDialog, DetailDialog, etc.)
12. Build data table components (DataTableColumnHeader, Toolbar, Pagination, etc.)
13. Build form controls (domain-aware selects, inputs, date pickers)
14. Build wizard/stepper component
15. Build status badge system
16. Build utility hooks (useTableUrlState, useDialogState)

### Phase 3: API Integration Layer
17. Set up re-export layer for generated API clients in `src/lib/api/`
18. Build query/mutation hook factories

### Phase 4: Domain Screens (by priority)
19. **Dashboard** — KPIs, charts, pick heatmap
20. **Master Data** — Products, Brands, Categories, Clients, Vendors, Carriers, UOMs
21. **Warehouse Structure** — Facilities, Zones, Locations
22. **Inventory** — On-hand inquiry, LPN lookup, Adjustments, Holds, Allocations
23. **Inbound** — ASNs, Purchase Orders, Receiving, Putaway, Returns
24. **Outbound — Sales Orders** — Order management, Allocation
25. **Outbound — Waves & Picking** — Wave planning, Pick tasks, Cluster/batch picking
26. **Outbound — Packing** — Pack stations, Cartonization, Exceptions
27. **Outbound — Staging & Shipping** — Staging lanes, Load building, Trailer management
28. **Quality** — Inspections, Profiles, Defect codes, NCRs
29. **Labor** — Shifts, Time tracking, Performance metrics
30. **Equipment** — Equipment CRUD, Maintenance
31. **Dock-Yard** — Appointments, Yard vehicles
32. **Exceptions** — Exception tracking, Escalation rules
33. **Settings** — System settings
34. **Billing** — Storage rates, Invoices
35. **Reports & Analytics** — Report generation, KPIs, Heatmaps
36. **Cycle Counts** — Count generation, Execution, Supervisor review
37. **Work Orders** — Assembly/kitting, Operations, Components

### Phase 5: Polish
38. Global search (CommandMenu)
39. Notifications system
40. Error boundaries + error pages
41. Loading states + skeletons
42. Tests for critical flows
43. RTL support verification
44. Performance optimization

---

## 16. Key Backend Status Information

Reference the following from `docs/PROJECT_CAPABILITIES.md` (this is the **already-built backend** — no backend work needed):
- **~430 web endpoints**, 74 web controllers, 22 domains — all ready to consume
- **API prefix:** `/api/v1/wms` (all web endpoints)
- **Auth:** Bearer JWT (issued by SaaS Core on port 3001, verified by WMS backend on port 3002)
- **RBAC:** 7 roles, 86 subjects, 31 actions via CASL
- **Response format:** Standard envelope via `ResponseInterceptor`
- **Error format:** RFC 7807 `application/problem+json`
- **Multi-tenancy:** Via JWT `tenantId` claim, `X-Tenant-Code` header

### Known Backend Gaps (from Appendix C) — affects UI decisions, NOT backend work
- Some web controllers lack CASL `@CheckAbility` guards (master-data, warehouse, some inbound/outbound) — UI should still show/hide actions based on roles
- No WebSocket/real-time push — polling or periodic refetch required
- Some endpoints use legacy `_old` status enums — handle both in UI
- Mix of enum vs string status fields in newer models

---

## 17. Important Reminders

- **Do NOT modify** `next-shadcn-admin-dashboard/` — reference only.
- **Do NOT modify** files in `API/` — these are generated (Orval). Only read from them.
- **Do NOT do any backend work** — the WMS backend is already built and running. All development goes in `new-wmsfrontend/`.
- **All development goes in** `new-wmsfrontend/`.
- Always check existing patterns before writing new code.
- Use `safeArray()` for response normalization, never assume response shape.
- Use `handleServerError()` for mutation error handling.
- Follow the import order groups from Prettier config.
- No console.log in production code (enforced by ESLint).
- Keep feature code co-located with routes until reused.
- Slide-out drawers > modal dialogs for operational detail views.
- Every operational table needs loading, empty, error, and populated states.

## 18. Product Master Data UI

### Route
`/master-data/products` — Product list page within `_authenticated` route group.

### Files Created
- `src/features/products/types/product.ts` — TypeScript types for Product, DTOs, query params
- `src/features/products/schemas/product-schema.ts` — Zod schemas for create/edit forms
- `src/features/products/data/product-queries.ts` — React Query hooks (useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct) with cache invalidation and toast notifications
- `src/features/products/components/create-product-form.tsx` — React Hook Form + Zod with shadcn/ui controls
- `src/features/products/components/create-product-dialog.tsx` — Dialog wrapping create form + mutation
- `src/features/products/components/edit-product-dialog.tsx` — Pre-populated edit dialog
- `src/features/products/components/view-product-dialog.tsx` — Read-only detail dialog
- `src/features/products/components/...` (additional components as needed)
- `src/routes/_authenticated/master-data/products.tsx` — Route page with TanStack Table v8, server-side search/pagination, all CRUD actions

### Data Table Components
- `src/components/data-table/data-table.tsx` — Generic `DataTable<T>` + `DataTableLoading` with skeleton rows
- `src/components/data-table/data-table-column-header.tsx` — Sortable column header (asc/desc/hide)
- `src/components/data-table/data-table-pagination.tsx` — Page nav, rows per page, "Showing X-Y of Z"
- `src/components/data-table/data-table-toolbar.tsx` — Search input + filter reset

### Form Component
- `src/components/ui/form.tsx` — React Hook Form integration (Form, FormField, FormItem, FormLabel, FormControl, FormMessage)

### Dialogs
- `src/components/common/dialogs/confirm-dialog.tsx` — AlertDialog-based confirmation with loading state
- `src/components/common/dialogs/create-entity-dialog.tsx` — Dialog with title, description, form slot, submit/cancel

### API Layer
- `src/lib/api/wms-api/products.ts` — Typed wrappers for product CRUD using `customInstance` (bypasses generated API which lacks body/param support)

### Interceptor Change
- `API/wms-core-lib/http/httpClient.ts` — Added `X-Facility-Code` header injection from `localStorage.getItem('facility_code')`
