# Prompt 08 — Roles & Permissions Management

## Task

Build the Roles & Permissions module. System Admins can create/edit roles, view the role hierarchy, assign/revoke permissions, and see inherited permissions.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/roles/roles`:
- `RoleController_findAll` (GET /roles with params)
- `RoleController_create` (POST /roles)
- `RoleController_findById` (GET /roles/:id)
- `RoleController_update` (PATCH /roles/:id)
- `RoleController_delete` (DELETE /roles/:id — soft-delete)
- `RoleController_getHierarchy` (GET /roles/hierarchy)
- `RoleController_assignPermission` (POST /roles/:id/permissions)
- `RoleController_revokePermission` (DELETE /roles/:id/permissions/:permissionId)
- `RoleController_getInheritedPermissions` (GET /roles/:id/permissions/inherited)

From `@/lib/api/wms-saas-core-api/permissions/permissions`:
- `PermissionController_findAll` (GET /permissions with params)
- `PermissionController_create` (POST /permissions)
- `PermissionController_findById` (GET /permissions/:id)
- `PermissionController_update` (PATCH /permissions/:id)
- `PermissionController_delete` (DELETE /permissions/:id)

Types: `CreateRoleDto`, `UpdateRoleDto`, `AssignPermissionDto`, `CreatePermissionDto`, `RoleControllerFindAllParams`, `PermissionControllerFindAllParams`

## Files to Create

### 1. `src/pages/roles/roles-list.tsx`

Roles list page:
- Table columns: Role Name, Code, Type (system/tenant), Parent Role, Users Count, Status, Actions
- "Create Role" button
- Toggle: "Show Hierarchy" button that switches to tree view

**Hierarchy View:**
- Tree/collapsible view showing parent-child relationships
- Root roles expanded by default
- Click role to see details

**Row Actions:**
- Edit (dialog)
- Manage Permissions (dialog)
- View Inherited Permissions (dialog)
- Delete (confirmation — with warning if roles are assigned)

### 2. `src/pages/roles/role-create-dialog.tsx`

Create/edit role dialog:
- Role Name (required)
- Role Code (auto-generated from name, editable)
- Role Type (System or Tenant) — radio/select
- Parent Role (tree select from existing roles)
- Description (textarea)
- Submit/Cancel

### 3. `src/pages/roles/role-permissions-dialog.tsx`

Permission assignment dialog:
- Left panel: role info (name, code)
- Right panel: permission tree
  - Grouped by resource type (users, tenants, roles, billing, etc.)
  - Checkbox tree: resource → action → permission
  - Currently assigned permissions pre-checked
- Search/filter permissions by name
- Save/Cancel
- On save: calls assign/revoke permission APIs as needed

### 4. `src/pages/permissions/permissions-list.tsx`

Permissions list page (reachable via tab or sub-nav):
- Table columns: Permission Code, Resource Type, Resource Action, Scope (tenant/system), Type, Created
- "Create Permission" button
- Search by code
- Filter by resource type

### 5. `src/pages/permissions/permission-create-dialog.tsx`

Create/edit permission dialog:
- Permission Code (required, e.g., `users:read`)
- Resource Type (required, suggestion dropdown)
- Resource Action (required: create, read, update, delete, manage)
- Resource Scope (System or Tenant)
- Permission Type (system, tenant, user)
- Description
- Submit/Cancel

### 6. `src/hooks/roles.ts` & `src/hooks/permissions.ts`

Custom hooks for roles and permissions data fetching.

## UI/UX Requirements

- Hierarchy tree: use recursive component with collapse/expand
- Permission tree: use nested checkboxes with parent/child sync
- Search bar for permissions (to filter long lists)
- Delete confirmation: "Are you sure? This will affect all users assigned to this role."
- If role has child roles, warn that children will lose inherited permissions
- Show "Inherited Permissions" in a read-only view (gray background, no checkboxes)
- Permission grouping: group by `resourceType` with expandable sections
- Loading skeleton for both list and tree views

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/roles` loads with table of roles
2. Hierarchy toggle shows tree view
3. Create role dialog works
4. Edit role updates role name, description
5. Delete role with confirmation
6. Manage permissions: open dialog, see permission tree
7. Assign permission to role
8. Revoke permission from role
9. View inherited permissions (read-only)
10. `/permissions` lists all permissions
11. Create permission creates new permission code
