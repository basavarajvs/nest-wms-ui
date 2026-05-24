# Prompt 07 — User Management

## Task

Build the User Management module: list system users, create users, invite users, view/edit user details, assign roles, deactivate/reactivate users, and set custom attributes.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/users/users`:
- `UserController_findAll` (GET /users with params)
- `UserController_create` (POST /users)
- `UserController_findOne` (GET /users/:id)
- `UserController_update` (PATCH /users/:id)
- `UserController_remove` (DELETE /users/:id — soft-delete)
- `UserController_deactivate` (POST /users/:id/deactivate)
- `UserController_reactivate` (POST /users/:id/reactivate)
- `UserController_invite` (POST /users/invitations)
- `UserController_assignRole` (POST /users/:id/roles)
- `UserController_revokeRole` (DELETE /users/:id/roles/:roleId)
- `UserController_approveRole` (POST /users/roles/approve/:userRoleId)
- `UserController_resetPin` (POST /users/:id/pin/reset)
- `UserController_setAttribute` (POST /users/:id/attributes)
- `UserController_getAttributes` (GET /users/:id/attributes)

From `@/lib/api/wms-saas-core-api/users` types:
- `UserControllerFindAllParams` — pagination/filter params
- `CreateUserDto` — user creation payload
- `UpdateUserDto` — user update payload
- `InviteUserDto` — invite payload
- `AssignRoleDto` — role assignment payload

From `@/lib/api/wms-saas-core-api/roles/roles`:
- `RoleController_findAll` (GET /roles) — for role dropdowns

## Files to Create

### 1. `src/pages/users/users-list.tsx`

Users list page:
- Search by name or email
- Filter by status dropdown (Active, Inactive, Pending, All)
- Filter by role dropdown
- Table columns: Name, Email, Status, Roles, Created, Actions
- Pagination
- "Create User" and "Invite User" buttons

**User Status Badges:**
- Active → green
- Inactive → gray
- Pending (invitation not accepted) → amber
- Suspended → red

**Row Actions:**
- Edit (opens dialog)
- Deactivate/Reactivate (confirmation dialog)
- Manage Roles (opens role assignment dialog)
- View Details (opens detail panel)

### 2. `src/pages/users/user-create-dialog.tsx`

Create user dialog:
- Email (required)
- First Name (required)
- Last Name (required)
- Phone (optional)
- Role assignment (multi-select dropdown from roles API)
- Send invitation email toggle
- Submit/Cancel

### 3. `src/pages/users/user-invite-dialog.tsx`

Invite user dialog:
- Email (required)
- Role (dropdown from roles API)
- Optional message
- Submit/Cancel
- On success: toast "Invitation sent to {email}"

### 4. `src/pages/users/user-detail-panel.tsx`

User detail (can be a slide-over panel or dialog):
- Personal info (name, email, phone, timezone)
- Status
- Assigned roles (list with remove button)
- Attributes (key-value pairs, add/remove)
- Activity (recent sessions)
- Audit history (recent actions by this user)

### 5. `src/pages/users/user-role-dialog.tsx`

Role assignment dialog:
- Available roles list (checkboxes)
- Currently assigned roles pre-checked
- Save/Cancel
- On save: calls assign/revoke role APIs

### 6. `src/hooks/users.ts`

Wrapper hooks for consistent data fetching:

```typescript
export function useUsers(params?: UserControllerFindAllParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => UserController_findAll(params),
  });
}
```

## UI/UX Requirements

- Reuse the DataTable component from Prompt 06
- Search with debounce
- Multi-step invite: use Dialog with form
- Role assignment: use a multi-select or checkbox list within Dialog
- Deactivate shows confirmation: "Are you sure you want to deactivate {user}?"
- After deactivation, the "Reactivate" option becomes available
- Attributes section: key-value pair editor (add row, edit, delete)
- Loading skeleton for table
- Empty state: "No users found"

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/users` loads with user table
2. Search works for name/email
3. Filter by status
4. Create user dialog opens, submits, refreshes
5. Invite user dialog works
6. Deactivate user with confirmation
7. Reactivate user
8. Role assignment dialog shows available roles
9. Assign role to user
10. User detail shows attributes
11. Pagination works
