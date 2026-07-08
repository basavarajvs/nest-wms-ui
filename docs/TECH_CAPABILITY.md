# Tech Capability Document

Source : https://github.com/arhamkhnz/next-shadcn-admin-dashboard
 
## 1. Technology Stack Overview

| Layer              | Technology                          | Version      |
| ------------------ | ----------------------------------- | ------------ |
| **Framework**      | React                               | ^19.2.5      |
| **Language**       | TypeScript                          | ~6.0.3       |
| **Build Tool**     | Vite                                | ^8.0.8       |
| **Package Manager**| pnpm                                | —            |
| **Routing**        | TanStack Router                     | ^1.168.22    |
| **Server State**   | TanStack React Query                | ^5.99.0      |
| **Client State**   | Zustand                             | ^5.0.12      |
| **UI Library**     | shadcn/ui (Radix primitives)        | —            |
| **Styling**        | Tailwind CSS v4                     | ^4.2.2       |
| **Forms**          | React Hook Form + Zod               | ^7.72.1 / ^4.3.6 |
| **HTTP Client**    | Axios                               | ^1.15.0      |
| **Tables**         | TanStack React Table                | ^8.21.3      |
| **Auth**           | Clerk (@clerk/react)                | ^6.4.2       |
| **Charts**         | Recharts                            | ^3.8.1       |
| **Icons**          | Lucide React + Radix Icons          | ^1.8.0 / ^1.3.2 |
| **Testing**        | Vitest + Playwright                 | ^4.1.4       |
| **Linting**        | ESLint v10 + typescript-eslint      | ^10.2.1      |
| **Formatting**     | Prettier v3                         | ^3.8.3       |
| **Dead Code**      | Knip                                | ^6.4.1       |

---

## 2. Project Structure & Code Organization

```
src/
├── assets/                  # SVG icons (brand, custom, logos)
├── components/
│   ├── common/
│   │   ├── dialogs/         # Reusable dialog wrappers (ConfirmDialog, CreateEntityDialog, etc.)
│   │   └── forms/           # Domain-aware form controls (ProductSelect, FacilitySelect, etc.)
│   ├── data-table/          # Reusable TanStack Table building blocks
│   ├── layout/              # App shell: sidebar, header, nav, facility selector
│   ├── status-badges/       # Status badge components
│   ├── ui/                  # shadcn/ui primitives (button, dialog, table, etc.)
│   └── wizard/              # Stepper/multi-step dialog framework
├── config/                  # App configuration (fonts list)
├── context/                 # React Context providers (auth, theme, layout, facility, font, direction, search)
├── features/                # Domain feature modules (domain-specific, not covered here)
├── hooks/                   # Shared custom hooks
├── lib/
│   ├── api/
│   │   ├── wms-api/         # Hand-curated wrappers calling generated WMS API functions
│   │   └── wms-saas-core-api/ # Hand-curated wrappers calling generated SaaS Core API functions
│   ├── http/                # Re-exports for httpClient/httpSaasClient
│   └── types/               # Generated TypeScript types (WMS + SaaS Core)
│   ├── cookies.ts           # Cookie get/set/remove utilities
│   ├── handle-server-error.ts # Server error → toast notification
│   ├── httpClient.ts        # Axios instance for WMS backend
│   ├── httpSaasClient.ts    # Axios instance for SaaS Core backend
│   ├── queryClient.ts       # React Query client configuration
│   └── utils.ts             # cn(), sleep(), getPageNumbers(), getDisplayNameInitials()
├── routes/                  # TanStack Router file-based route tree
├── stores/                  # Zustand stores
├── styles/                  # Global CSS (Tailwind imports, theme variables, animations)
├── test-utils/              # Test setup utilities
├── types/                   # App-level type declarations
├── main.tsx                 # App entry point with provider nesting
└── routeTree.gen.ts         # Auto-generated route tree
```

**Path alias**: `@/` maps to `./src/` (configured in both `tsconfig.json` and `vite.config.ts`).

---

## 3. UI Component Architecture

### 3.1 shadcn/ui Pattern

All UI primitives follow the **shadcn/ui** pattern: copy-paste components built on **Radix UI** headless primitives, styled with Tailwind CSS via `class-variance-authority` (CVA).

**shadcn/ui configuration** (`components.json`):
- Style: `new-york`
- CSS variables enabled
- Icon library: `lucide`
- Aliases: `@/components/ui`, `@/lib/utils`, `@/hooks`

### 3.2 Installed Radix Primitives

| Primitive                     | Package                                  |
| ----------------------------- | ---------------------------------------- |
| Alert Dialog                  | `@radix-ui/react-alert-dialog`          |
| Avatar                        | `@radix-ui/react-avatar`                |
| Checkbox                      | `@radix-ui/react-checkbox`              |
| Collapsible                   | `@radix-ui/react-collapsible`           |
| Dialog                        | `@radix-ui/react-dialog`                |
| Direction                     | `@radix-ui/react-direction`             |
| Dropdown Menu                 | `@radix-ui/react-dropdown-menu`         |
| Icons                         | `@radix-ui/react-icons`                 |
| Label                         | `@radix-ui/react-label`                 |
| Popover                       | `@radix-ui/react-popover`               |
| Radio Group                   | `@radix-ui/react-radio-group`           |
| Scroll Area                   | `@radix-ui/react-scroll-area`           |
| Select                        | `@radix-ui/react-select`                |
| Separator                     | `@radix-ui/react-separator`             |
| Slot                          | `@radix-ui/react-slot`                  |
| Switch                        | `@radix-ui/react-switch`                |
| Tabs                          | `@radix-ui/react-tabs`                  |
| Tooltip                       | `@radix-ui/react-tooltip`               |

### 3.3 CVA (Class Variance Authority) Pattern

Every shadcn/ui component uses `cva` to define variant-based styling:

```ts
// Pattern used in all ui/* components
const buttonVariants = cva(
  "base-classes",   // shared styles
  {
    variants: {
      variant: { default: "...", destructive: "...", outline: "...", ghost: "...", link: "..." },
      size: { default: "...", sm: "...", lg: "...", icon: "..." },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({ className, variant, size, asChild, ...props }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

Key features:
- **asChild** prop via `@radix-ui/react-slot` for polymorphic composition
- **cn()** utility (`clsx` + `tailwind-merge`) for class merging
- `data-slot` attributes on all elements for test/tooling targeting

### 3.4 Layout Components

The app shell is composed of:

- **SidebarProvider / Sidebar** - Responsive sidebar with three collapsible modes (`offcanvas`, `icon`, `none`) and three layout variants (`inset`, `sidebar`, `floating`). Managed by `LayoutContext`.
- **SidebarInset** - Main content area that adjusts to sidebar state.
- **Header** - Sticky header with scroll-aware shadow/backdrop.
- **Main** - Content wrapper with optional fixed/fluid modes and responsive max-width.
- **FacilitySelector** - Popover/command-based facility switcher at top of content area.
- **AppSidebar** - Composed from sidebar primitives + NavGroup + NavUser + TeamSwitcher.
- **NavGroup** - Renders nav items with collapsible sub-groups and role-based filtering.
- **FilterSidebar** - Utility to filter navigation items by user roles.

Layout preferences (collapsible mode, variant, sidebar open state) are persisted in cookies.

### 3.5 Common UI Building Blocks

#### Dialogs
- **`ConfirmDialog`** - `AlertDialog`-based confirmation with loading state and destructive styling option.
- **`CreateEntityDialog`** - `Dialog` wrapper with title, description, form slot, and submit/cancel buttons.
- **`DetailDialog`** - Read-only detail view dialog.
- **`EditEntityDialog`** - Edit-mode dialog wrapper.
- **`SubmitForApprovalDialog`** - Approval submission dialog.
- **`OverrideAllocationDialog`** - Allocation override dialog.

#### Form Controls
Domain-aware form components that integrate with React Hook Form (`FormField`):
- `ProductSelect`, `FacilitySelect`, `LocationSelect`, `UserSelect`, `ZoneSelect`
- `PrioritySelect`, `StatusSelect`, `TransferTypeSelect`, `FormatSelect`, `ReportTypeSelect`
- `CountMethodSelect`, `RoleSelect`, `VelocityClassSelect`, `ProductCategorySelect`, `UomSelect`, `ReasonSelect`
- `DateRangePicker`, `ExpiryDatePicker`
- `LotNumberInput`, `QuantityInput`, `NameInput`, `CodeInput`, `NotesTextarea`, `DescriptionTextarea`

Each follows the same pattern: accept `control` + `name` from `useForm`, render `FormField` → `FormItem` → `FormLabel` → `Select`/`Input` → `FormMessage`, and fetch data via React Query internally.

#### Wizard / Stepper
- **`StepperDialog`** - Multi-step dialog with visual progress indicator (completed/current/pending states), Back/Next/Submit navigation, `onBeforeNext` async validation hook, and loading state.
- **`Step` interface** - `id`, `title`, `description?`, `icon?`
- **`StepperDialogProps`** - Full type definition for steps, navigation, and completion callbacks.

#### Command Palette
- **`CommandMenu`** - `cmdk`-based command palette (`⌘K` shortcut) for global search/navigation.
- **`CommandDialog`** - Dialog wrapper for command palette.

#### Other Components
- **`NavigationProgress`** - `react-top-loading-bar` integrated with TanStack Router state for route transition progress.
- **`ThemeSwitch`** - Dark/light/system theme toggle in header.
- **`Search`** - Search trigger button with keyboard shortcut badge.
- **`ErrorBoundary`** - React error boundary for crash recovery.
- **`ProtectedRoute`** - Auth gate with loading spinner and redirect.
- **`ComingSoon`** - Placeholder page.
- **`LongText`** - Text truncation component.
- **`PasswordInput`** - Input with show/hide toggle.
- **`StatusTimeline`** - Vertical timeline for status changes.
- **`Barcode`** - `jsbarcode` integration for barcode generation.
- **`LoadingSkeleton`** - Skeleton loading placeholders.

### 3.6 Status Badge System

`src/components/status-badges/StatusBadges.tsx` — Centralized mapping of domain status values to badge variants with color coding, used across all list/detail views.

---

## 4. Routing Architecture

### 4.1 TanStack Router (File-Based)

Routes are defined as files under `src/routes/` following TanStack Router's file-based convention. The route tree is auto-generated to `src/routeTree.gen.ts`.

**Route structure:**
```
src/routes/
├── __root.tsx                  # Root layout: NavigationProgress, Outlet, Toaster, React Query DevTools, Router DevTools
├── index.tsx                   # / redirect
├── (auth)/                     # Public auth routes (login, sign-up, forgot-password, OTP)
│   ├── login.tsx
│   └── ...
├── _authenticated/             # Authenticated layout group (all protected routes)
│   ├── route.tsx               # Layout route: beforeLoad auth check, ProtectedRoute, AuthenticatedLayout
│   ├── index.tsx               # Dashboard
│   ├── brands.tsx              # Feature routes
│   ├── clients.tsx
│   └── ... (50+ feature routes)
└── (errors)/                   # Error pages (401, 403, 404, 500, 503)
```

### 4.2 Route Configuration

- Router created with `createRouter` in `main.tsx` with `defaultPreload: 'intent'` (preloads on hover).
- Root route uses `createRootRouteWithContext<{ queryClient, auth }>()` for typed context injection.
- Authenticated routes use `beforeLoad` hook to check auth state and redirect to `/login`.
- `errorComponent` and `notFoundComponent` defined at root level for global error handling.
- Route context is injected via `InnerApp` pattern (auth is loaded async).
- Auto code-splitting enabled via `tanstackRouter({ autoCodeSplitting: true })` in Vite config.

### 4.3 DevTools

In development mode:
- `TanStackRouterDevtools` (bottom-right)
- `ReactQueryDevtools` (bottom-left)

---

## 5. State Management

### 5.1 Server State: TanStack React Query

```ts
// src/lib/queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0, onError: (error) => console.error('[Mutation Error]', error) },
  },
})
```

**Pattern:** Each feature defines query/mutation hooks in a data file (e.g., `features/brands/data/brand-queries.ts`):
- `useBrands()` — `useQuery` to fetch list
- `useBrand(id)` — `useQuery` for detail
- `useCreateBrand()` — `useMutation` with `onSuccess` invalidation
- `useUpdateBrand()` — `useMutation` with `onSuccess` invalidation
- `useDeleteBrand()` — `useMutation` with `onSuccess` invalidation

**Response normalization:** A `safeArray()` helper handles various API response shapes (plain array, `{ items: [] }`, `{ data: [] }`).

**Query keys** follow the pattern: `['wms', 'domain', 'entity', action]`.

### 5.2 Client State: Zustand

Used for lightweight client-side state:

```ts
// src/stores/auth-store.ts
export const useAuthStore = create<AuthState>()((set) => ({
  auth: {
    user: null,
    accessToken: '',  // synced to cookie
    setUser, setAccessToken, resetAccessToken, reset,
  },
}))
```

The auth store is separate from the auth context — the store manages a secondary access token (cookie-synced), while the auth context handles the primary JWT auth flow.

### 5.3 Context Providers

The app uses a layered context architecture in `main.tsx`:

```
QueryClientProvider
  └─ AuthProvider           (auth state, login/logout/refresh)
      └─ FacilityProvider    (facility list, selected facility)
          └─ ThemeProvider   (dark/light/system theme, cookie-persisted)
              └─ FontProvider (font selection, cookie-persisted)
                  └─ DirectionProvider  (LTR/RTL, cookie-persisted, wraps Radix DirectionProvider)
                      └─ TooltipProvider (Radix tooltip delay)
                          └─ ErrorBoundary
                              └─ InnerApp (RouterProvider)
```

Additionally, `LayoutProvider` and `SearchProvider` are used inside the authenticated layout.

---

## 6. Form Handling

### 6.1 Stack

- **React Hook Form** (`react-hook-form` v7) with TypeScript generics for type-safe forms.
- **Zod** for schema validation via `@hookform/resolvers/zod`.
- **shadcn/ui Form** components (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) built on React Hook Form's `Controller` and `FormProvider`.

### 6.2 Form Definition Pattern

```ts
const schema = z.object({
  brandCode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  isActive: z.boolean().optional().default(true),
})

const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... },
})
```

### 6.3 Integration with UI Components

```tsx
<FormField
  control={form.control}
  name="productId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Product</FormLabel>
      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
        </FormControl>
        <SelectContent>
          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 7. API Integration

### 7.1 HTTP Clients

The app communicates with **two backends**, each with its own Axios instance:

| Client              | Backend              | Base URL Env Var                  |
| ------------------- | -------------------- | --------------------------------- |
| `httpClient.ts`     | WMS API              | `VITE_API_BASE_URL`               |
| `httpSaasClient.ts` | SaaS Core API        | `VITE_SAAS_API_BASE_URL`          |

### 7.2 Interceptor Architecture (Identical for Both Clients)

**Request interceptor:**
- Attaches `Authorization: Bearer {token}` from localStorage
- Attaches `X-Tenant-Code` header from localStorage

**Response interceptor:**
- Normalizes error response shape (extracts nested error message)
- **401 token refresh queue**: If a 401 response is received (and it's not already a retry and not the refresh endpoint):
  1. If a refresh is already in progress, adds the request to a `failedQueue` and returns a promise that resolves when the refresh completes
  2. Otherwise, calls `attemptTokenRefresh()` via a dedicated Axios POST to the auth refresh endpoint
  3. On success: stores new tokens, processes the queue retrying all queued requests
  4. On failure: clears auth state, redirects to `/login`

### 7.3 API Client Layer

**Orval-generated clients** in `src/lib/api/`:
- `wms-api/` — Generated by orval from WMS API OpenAPI spec. Produces typed functions + React Query hooks (e.g., `BrandWebController_findAll()`, `useBrandWebControllerFindAll()`).
- `wms-saas-core-api/` — Generated by orval from SaaS Core API OpenAPI spec. Same pattern.

**Generated client call pattern:**
```ts
// Direct call (not using generated Query hooks)
import { BrandWebController_findAll } from '@/lib/api/wms-api/wms-web/wms-web'

const response = await BrandWebController_findAll()
```

**Generated type files** in `src/lib/types/`:
- `wms-api/` — 100+ generated TypeScript interfaces (DTOs, response types)
- `wms-saas-core-api/` — 100+ generated TypeScript interfaces

### 7.4 Data Access Pattern (Custom React Query Hooks)

Rather than using the generated query hooks directly, the app wraps them in custom hooks:

```ts
export function useBrands() {
  return useQuery({
    queryKey: ['wms', 'brands', 'list'],
    queryFn: () => BrandWebController_findAll(),
    select: (data) => ({
      brands: safeArray<Brand>(data),
      total: safeTotal(data),
    }),
    staleTime: 1000 * 60 * 5,
  })
}
```

This provides:
- Normalized response shapes via `safeArray`/`safeTotal`
- Typed return values
- Consistent query key patterns
- Configurable stale times per entity

---

## 8. Styling System

### 8.1 Tailwind CSS v4

Configured via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed in v4).

**Entry CSS** (`src/styles/index.css`):
```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import './theme.css';
@custom-variant dark (&:is(.dark *));
```

### 8.2 CSS Architecture

| File              | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `index.css`       | Tailwind imports, base styles, custom utilities (`container`, `no-scrollbar`, `faded-bottom`), `@theme inline` block with CSS variable mappings, CSS animations (`slideDown`/`slideUp`), Radix scroll-lock override |
| `theme.css`       | CSS variable values for light (`:root`) and dark (`.dark`) modes — all values in OKLCH color space |

### 8.3 Theme Variables

Light and dark themes defined via CSS custom properties:
- `--background`, `--foreground`, `--card`, `--popover`
- `--primary`, `--secondary`, `--accent`, `--destructive`, `--muted`
- `--border`, `--input`, `--ring`
- `--sidebar-*` (sidebar-specific colors)
- `--chart-1` through `--chart-5`
- `--radius` and radius scale (`--radius-sm` through `--radius-4xl`)
- Shadow variables with OKLCH-based shadow color

### 8.4 Animation

- **`tw-animate-css`** — Tailwind CSS animation plugin for enter/exit animations (fade, zoom, slide).
- **Custom animations** — `slideDown`/`slideUp` for `CollapsibleContent` using `@keyframes`.

### 8.5 Font System

Defined in `src/config/fonts.ts`:
```ts
export const fonts = ['google-sans', 'plus-jakarta-sans', 'inter', 'manrope', 'jetbrains-mono', 'system']
```

- Fonts loaded via Google Fonts `<link>` in `index.html`.
- Applied via `FontProvider` context that adds `font-{name}` class to `<html>`.
- Font families mapped in `@theme inline` block via `--font-sans`, `--font-mono`, `--font-serif`.

### 8.6 Dark Mode

- Applied via `.dark` class on `<html>` element.
- Toggle managed by `ThemeProvider` (supports `light`, `dark`, `system` modes).
- Theme preference persisted in a cookie (`vite-ui-theme`, 1 year expiry).
- System mode listens to `prefers-color-scheme` media query changes.
- `theme-color` meta tag updated on theme change.

### 8.7 RTL Support

- `DirectionProvider` wraps `@radix-ui/react-direction`'s `DirectionProvider`.
- Direction (LTR/RTL) stored in cookie (`dir`, 1 year expiry).
- `dir` attribute set on `<html>` element.
- RTL-aware class names used via Tailwind's logical properties (`inset-s-*`, `inset-e-*`, `ms-*`, `me-*`).

### 8.8 Font Letter Spacing

Custom letter-spacing tokens defined as CSS variables with `--tracking-normal` as the base, with relative offsets for tighter/wider variants.

### 8.9 Shadow System

Shadows defined using OKLCH-based `--shadow-color` with configurable opacity, blur, spread, and offset. Shadow scale from `--shadow-2xs` through `--shadow-2xl`.

---

## 9. Authentication & Authorization

### 9.1 Auth Provider (Context)

`AuthContext` provides:
```ts
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login, logout, refreshToken
}
```

**Token storage:** `auth_token`, `refresh_token`, `tenant_code`, `user_info` in localStorage.

**JWT handling:**
- `decodeTokenPayload(token)` — Base64-decodes JWT payload
- `isTokenExpired(token)` — Checks `exp` claim against current time
- Auto-refresh on page load if token is expired

### 9.2 Auth Flow

1. **Login**: POST to `/api/v1/auth/login` → stores tokens → fetches user profile via `/api/v1/users/me`
2. **Token Refresh**: Axios interceptor queues failed requests during refresh, retries them with new token
3. **Logout**: POST to `/api/v1/auth/logout` → clears all localStorage auth entries
4. **Initial Load**: Checks for existing token → refreshes if expired → fetches profile → sets user state

### 9.3 Route Protection

- `_authenticated/route.tsx` uses `beforeLoad` to check `auth.isAuthenticated` and redirect to `/login`.
- `ProtectedRoute` component shows a spinner during loading and redirects when not authenticated.
- Both auth and protected routes are in separate route groups.

### 9.4 Role-Based Access

- User roles are normalized from API response via `normalizeRoles()`.
- Sidebar navigation filtered by `filterSidebar()` utility based on user roles.
- Individual `NavItem` and `NavGroup` definitions include optional `roles[]` arrays.

### 9.5 Clerk Integration

`@clerk/react` v6.4.2 is a dependency, with `VITE_CLERK_PUBLISHABLE_KEY` in `.env.example`. The project supports both a custom JWT auth flow (primary) and Clerk as an alternative auth provider.

---

## 10. Data Table System

### 10.1 Core

**TanStack React Table v8** (`@tanstack/react-table`) with full manual/server-side control.

### 10.2 Reusable Components (src/components/data-table/)

| Component                | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `DataTableColumnHeader`  | Sortable column header with ascending/descending/hide menu |
| `DataTableToolbar`       | Search input + faceted filters + reset + view options |
| `DataTablePagination`    | Page navigation with page numbers, first/last, page size selector |
| `DataTableFacetedFilter` | Multi-select filter UI with checkboxes and counts    |
| `DataTableViewOptions`   | Column visibility toggle dropdown                    |
| `DataTableBulkActions`   | Floating action bar for selected rows with keyboard navigation |

### 10.3 URL State Synchronization

`useTableUrlState` hook synchronizes table state (pagination, global filter) with URL query parameters:

```ts
const tableUrlState = useTableUrlState({
  search,      // from router
  navigate,    // from router
  pagination: { defaultPage: 1, defaultPageSize: 10 },
  globalFilter: { enabled: true, key: 'q' },
})
```

Returns pagination state, global filter state, and change handlers that update the URL.

### 10.4 Table Usage Pattern

```tsx
const table = useReactTable({
  data, columns,
  state: { sorting, globalFilter, pagination },
  onSortingChange, onGlobalFilterChange, onPaginationChange,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})
```

Each feature page wraps the table in a `Card` with loading skeleton, error state, empty state, and the `DataTableToolbar` + `DataTablePagination` components.

### 10.5 Pagination Utility

`getPageNumbers()` in `lib/utils.ts` generates numbered page buttons with ellipsis for large page counts (1 2 3 4 ... 10 pattern).

---

## 11. Common UI Patterns

### 11.1 Dialog State Management

```ts
// use-dialog-state hook
const [open, setOpen] = useDialogState<'approve' | 'reject'>()
// Click toggles: null → 'approve' → null → 'reject' ...
```

Used across the app for confirmation dialogs (e.g., sign-out, delete confirmations).

### 11.2 Toast Notifications

- **sonner** library (`sonner` v2) for toast notifications.
- `Toaster` component rendered in root route, configured with `duration: 5000` and theme-aware styling.
- `handleServerError()` utility: extracts error messages from Axios errors and shows them via `toast.error()`.
- Success/error toasts shown after mutations in feature pages.

### 11.3 Error Boundaries

- `ErrorBoundary` wraps the entire app at the top provider level.
- Root route defines `errorComponent: GeneralError` and `notFoundComponent: NotFoundError`.
- Feature-specific error states in data tables with retry buttons.

### 11.4 Loading States

- Skeleton components for tables and cards during data loading.
- `LoadingBar` (`react-top-loading-bar`) for route transitions.
- Spinner animation in `ProtectedRoute` during auth check.
- Button `disabled` + "Processing..." / "Saving..." text during mutations.

### 11.5 Search (Global)

- `SearchProvider` context with `⌘K` / `Ctrl+K` shortcut.
- `Search` button component with keyboard shortcut badge.
- `CommandMenu` component for the actual search dialog.

---

## 12. Cookie Utilities

Custom cookie management (`src/lib/cookies.ts`) replaces `js-cookie`:

```ts
getCookie(name): string | undefined
setCookie(name, value, maxAge?): void    // default 7 days
removeCookie(name): void
```

Used by: `ThemeProvider`, `FontProvider`, `DirectionProvider`, `LayoutProvider`, `sidebar.tsx`, and `auth-store.ts`.

---

## 13. Generated API Clients

### 13.1 Orval Generation

Two OpenAPI specs generate complete API client layers:

**WMS API Client** (`generated-wms-client/`):
- ~34,764 lines of generated code
- All WMS endpoints (web, RF, scanner, integrations)
- TanStack React Query hooks for every endpoint
- Complete type definitions for DTOs and responses

**SaaS Core API Client** (`generated-saas-core-client/`):
- Domain-agnostic multi-tenant SaaS platform API
- Auth, RBAC/ABAC, billing, notifications, webhooks, audit, quota management
- Supports both JWT Bearer and API Key authentication
- Tenant resolution via `X-Tenant-Code` header or subdomain

### 13.2 Re-export Layer

The `src/lib/api/` directory contains hand-curated re-exports that wrap the generated client functions with clean import paths and type-safe interfaces, allowing feature data files to import cleanly:

```ts
// Feature data files import from here
import { BrandWebController_findAll } from '@/lib/api/wms-api/wms-web/wms-web'
```

---

## 14. Testing

### 14.1 Test Runner

- **Vitest** v4 with browser-mode enabled.
- **Playwright** Chromium provider for browser environment.
- UI mode available via `vitest --ui`.

### 14.2 Test Commands

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `pnpm test`           | Run tests headless in Chromium   |
| `pnpm test:watch`     | Watch mode                       |
| `pnpm test:ui`        | Vitest UI dashboard              |
| `pnpm test:coverage`  | Run with coverage (v8)           |
| `pnpm test:browser`   | Browser mode                     |

### 14.3 Configuration (vite.config.ts)

```ts
test: {
  silent: 'passed-only',
  unstubEnvs: true,
  browser: {
    enabled: true,
    provider: playwright(),
    instances: [{ browser: 'chromium' }],
  },
  coverage: {
    exclude: ['src/components/ui/**', 'src/assets/**', 'src/tanstack-table.d.ts', 'src/routeTree.gen.ts', 'src/test-utils/**', 'src/routes/**'],
  },
}
```

UI components, generated files, routes, and assets excluded from coverage.

### 14.4 Test Patterns

- `*.test.ts` / `*.test.tsx` files co-located with source (e.g., `use-table-url-state.test.ts`, `cookies.test.ts`, `confirm-dialog.test.tsx`, `auth-store.test.ts`, `config-drawer.test.tsx`).
- `src/test-utils/` contains test setup utilities for cookies and TanStack Table.

---

## 15. Development Tooling

### 15.1 TypeScript Configuration

Three `tsconfig` files:
| File                | Target  | Purpose             |
| ------------------- | ------- | ------------------- |
| `tsconfig.json`     | —       | Root with references |
| `tsconfig.app.json` | ES2020  | App source (`src/`)  |
| `tsconfig.node.json`| ES2022  | Vite config         |

Strict mode enabled globally with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`.

### 15.2 ESLint v10 Configuration

**Plugins:**
- `@eslint/js` (recommended rules)
- `typescript-eslint` (recommended rules)
- `@tanstack/eslint-plugin-query` (recommended rules)
- `eslint-plugin-react-hooks` (recommended rules)
- `eslint-plugin-react-refresh` (only-export-components)

**Key rules:**
- `no-console: error` — console.log disallowed in production
- `@typescript-eslint/no-unused-vars` — allows `_` prefix for unused parameters
- `@typescript-eslint/consistent-type-imports` — enforces `import type` with inline fix style
- `no-duplicate-imports` — prevents duplicate imports
- `@typescript-eslint/ban-ts-comment` — requires description for ts-expect-error/ts-ignore

**Ignores:** `dist`, `src/components/ui`, all `generated-*` directories.

### 15.3 Prettier Configuration

**Plugins:**
- `@trivago/prettier-plugin-sort-imports` — groups and orders imports
- `prettier-plugin-tailwindcss` — sorts Tailwind classes using `cn`/`clsx` functions

**Import order groups:**
1. Path/vite modules
2. React
3. Third-party (zod, axios, date-fns, react-hook-form, radix, tanstack)
4. `@/assets/`
5. `@/api/`
6. `@/stores/`
7. `@/lib/`
8. `@/utils/`
9. `@/constants/`
10. `@/context/`
11. `@/hooks/`
12. `@/components/layouts/`
13. `@/components/ui/`
14. `@/components/errors/`
15. `@/components/`
16. `@/features/`
17. Relative imports

**Formatting:** `semi: false`, `singleQuote: true`, `jsxSingleQuote: true`, `trailingComma: 'es5'`, `printWidth: 80`.

### 15.4 Knip (Dead Code Analysis)

```ts
const config: KnipConfig = {
  ignore: ['src/components/ui/**', 'src/components/layout/app-title.tsx', 'src/tanstack-table.d.ts'],
}
```

### 15.5 Commit Convention

- **Commitizen** (`cz.yaml`) configured for conventional commits.
- Changelog auto-generated on version bump.
- Semantic versioning (`v$version` format).

### 15.6 VSCode Recommendations

Extensions: Prettier, Tailwind CSS IntelliSense, ESLint, Vitest Explorer.
Settings: format-on-save, default formatter Prettier.

---

## 16. Build & Deployment

### 16.1 Build Process

- **Vite** with three plugins:
  1. `@tanstack/router-plugin/vite` — Route tree generation and auto code-splitting
  2. `@vitejs/plugin-react` — React Fast Refresh
  3. `@tailwindcss/vite` — Tailwind CSS processing
- Path alias `@` → `./src` configured in Vite resolve.

### 16.2 Deployment

- **Netlify** with SPA redirect rules (`netlify.toml`):
  ```toml
  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```

### 16.3 Environment Variables

| Variable                     | Purpose                  | Default              |
| ---------------------------- | ------------------------ | -------------------- |
| `VITE_API_BASE_URL`          | WMS backend URL          | `http://localhost:3001` |
| `VITE_SAAS_API_BASE_URL`     | SaaS Core backend URL    | `http://localhost:3000` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key    | —                    |

---

## 17. Package Ecosystem Summary

### Runtime Dependencies (34)

| Category         | Packages |
| ---------------- | -------- |
| **Framework**    | `react`, `react-dom` |
| **Routing**      | `@tanstack/react-router` |
| **State**        | `@tanstack/react-query`, `zustand` |
| **UI Primitives**| `@radix-ui/*` (18 packages), `cmdk` |
| **Styling**      | `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `clsx`, `class-variance-authority`, `tw-animate-css` |
| **Forms**        | `react-hook-form`, `@hookform/resolvers`, `zod` |
| **HTTP**         | `axios` |
| **Tables**       | `@tanstack/react-table` |
| **Auth**         | `@clerk/react` |
| **Icons**        | `lucide-react`, `@radix-ui/react-icons` |
| **Charts**       | `recharts` |
| **Date**         | `date-fns`, `react-day-picker` |
| **Notifications**| `sonner` |
| **Barcode**      | `jsbarcode` |
| **OTP**          | `input-otp` |
| **Loading**      | `react-top-loading-bar` |
| **Utils**        | `date-fns` |

### Dev Dependencies (27)

| Category         | Packages |
| ---------------- | -------- |
| **Build**        | `vite`, `@vitejs/plugin-react`, `@tanstack/router-plugin` |
| **Testing**      | `vitest`, `@vitest/browser-playwright`, `@vitest/coverage-v8`, `@vitest/ui`, `playwright`, `vitest-browser-react`, `@faker-js/faker` |
| **Linting**      | `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@tanstack/eslint-plugin-query` |
| **Formatting**   | `prettier`, `@trivago/prettier-plugin-sort-imports`, `prettier-plugin-tailwindcss` |
| **Types**        | `typescript`, `@types/react`, `@types/react-dom`, `@types/node` |
| **Dead Code**    | `knip` |
| **DevTools**     | `@tanstack/react-query-devtools`, `@tanstack/react-router-devtools` |
| **Git Hooks**    | (commitizen via `cz.yaml`) |
