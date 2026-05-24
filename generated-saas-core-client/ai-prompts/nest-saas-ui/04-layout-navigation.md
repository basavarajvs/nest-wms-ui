# Prompt 04 — Layout, Sidebar Navigation & Role-Based Menus

## Task

Build the application shell: sidebar navigation, top header bar, and role-based menu rendering. This integrates with the existing shadcn-admin sidebar component system.

**Key Design Decision**: The sidebar should show different nav items based on the user's role. Since this is a System Admin portal, most users will see all items, but read-only or limited-role users should see constrained menus.

## Approach

The shadcn-admin template already has a `Sidebar` component (built using shadcn's sidebar pattern), a `Header` with theme toggle, user avatar dropdown, and a search command palette. We need to:
1. Replace the demo navigation items with our SaaS Core menu structure
2. Make the navigation data-driven (based on user role/permissions)
3. Add the user dropdown with Profile, Security, Logout

## Files to Create/Modify

### 1. `src/config/navigation.ts`

Navigation configuration file that defines all menu items organized by section:

```typescript
export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  pattern?: string;  // regex pattern for active state, e.g. '/tenants/*'
  roles?: string[];  // which roles can see this (empty = all authenticated)
  children?: NavItem[];
  badge?: number;
}

export const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, pattern: '/$' },
  // Platform section
  { 
    title: 'Platform', 
    icon: Building2,
    children: [
      { title: 'Tenants', href: '/tenants', icon: Building2 },
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Roles', href: '/roles', icon: Shield },
      { title: 'Groups', href: '/groups', icon: UsersRound },
      { title: 'Audit Logs', href: '/audit', icon: ScrollText },
    ]
  },
  // Billing section
  {
    title: 'Billing',
    icon: CreditCard,
    children: [
      { title: 'Plans', href: '/license-plans', icon: FileText },
      { title: 'Subscriptions', href: '/subscriptions', icon: Receipt },
    ]
  },
  // ... rest of nav items
];
```

### 2. Modify the Sidebar (`src/components/layout/sidebar.tsx` or the existing sidebar location)

Replace demo nav with:
- Use `mainNavItems` config to render navigation
- Group items into sections with collapsible sections
- Highlight active item based on current route
- Show role-appropriate items (filter by `roles` array — if empty, show for all)
- Show a loading skeleton when user data is loading
- Show the app name/logo at top: "SaaS Core Admin"

### 3. Modify the Header (`src/components/layout/header.tsx` or existing header location)

Add:
- On the right side:
  - Notification bell icon with badge count (placeholder for now)
  - User avatar/dropdown menu with:
    - User name and email
    - "My Profile" link
    - "Security" link (password, MFA)
    - Separator
    - "Logout" button

### 4. User Dropdown Menu

Use shadcn's `DropdownMenu` component for the user menu:
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar>
      <AvatarImage src={user.avatarUrl} />
      <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => navigate('/profile')}>
      <User className="mr-2" /> My Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/security')}>
      <Shield className="mr-2" /> Security
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut className="mr-2" /> Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 5. App Layout Component

The main layout wraps all authenticated pages:
```tsx
// src/components/layout/app-layout.tsx
<div className="flex h-screen">
  <Sidebar />
  <div className="flex-1 flex flex-col">
    <Header />
    <main className="flex-1 overflow-auto p-6">
      <Outlet /> // TanStack Router outlet
    </main>
  </div>
</div>
```

### 6. Update Router

Create the route tree structure:
```
/                    → AppLayout
  /                  → Dashboard
  /tenants           → Tenants list
  /tenants/new       → Create tenant (dialog or page)
  /tenants/:id       → Tenant detail
  /users             → Users list
  /users/:id         → User detail
  /roles             → Roles list
  /groups            → Groups list
  /audit             → Audit logs
  /license-plans     → Plans list
  /subscriptions     → Subscriptions
  /api-keys          → API Keys
  /webhooks          → Webhooks
  /notifications     → Notifications
  /notification-templates → Templates
  /integrations      → Integrations
  /compliance        → Compliance
  /reports           → Reports
  /security          → Security events
  /quotas            → Resource quotas
  /system            → System settings
  /tenant-settings   → Tenant settings
  /profile           → My Profile
  /security-settings → Security settings

/login               → Login (no layout)
/mfa                 → MFA (no layout)
/forgot-password     → Forgot password (no layout)
/reset-password      → Reset password (no layout)
/register            → Register (no layout)
/verify-email        → Verify email (no layout)
```

All routes under `/` are protected (wrapped in ProtectedRoute).

## UI/UX Requirements

- Sidebar should be collapsible (hamburger icon) — shadcn-admin already has this
- Active nav item should be highlighted with primary color
- Section headers should show in uppercase muted text
- Icons for each menu item using Lucide icons
- On mobile: sidebar becomes an overlay/drawer
- The header should show the current page title as a breadcrumb
- Smooth transitions for sidebar collapse

## Existing shadcn-admin Components

The shadcn-admin template already has:
- `Sidebar`, `SidebarProvider`, `SidebarTrigger` baked in
- Theme toggle (light/dark/system)
- Command palette (Cmd+K search)
- These should be preserved and adapted

Adapt the existing sidebar structure rather than rebuilding from scratch.

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. Logged in → see sidebar with all nav items
2. Click each nav item → route changes, active state updates
3. Sidebar collapse works
4. User dropdown shows email
5. Theme toggle works
6. Mobile responsive: sidebar becomes drawer
7. Breadcrumb/header shows correct page title
