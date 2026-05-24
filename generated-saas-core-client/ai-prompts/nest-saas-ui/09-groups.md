# Prompt 09 — Groups Management

## Task

Build the Groups module. Groups are user collections that can be used for role-based assignments, notifications targeting, etc.

## API Hooks Used

From `@/lib/api/wms-saas-core-api/groups/groups`:
- `GroupController_findAll` (GET /groups) — list all groups
- `GroupController_create` (POST /groups)
- `GroupController_findOne` (GET /groups/:id)
- `GroupController_update` (PATCH /groups/:id)
- `GroupController_delete` (DELETE /groups/:id)
- `GroupController_addMember` (POST /groups/:id/members)
- `GroupController_removeMember` (DELETE /groups/:id/members/:userId)

Types: `CreateGroupDto`, `UpdateGroupDto`, `AddGroupMemberDto`

## Files to Create

### 1. `src/pages/groups/groups-list.tsx`

Groups list page:
- Table columns: Name, Description, Member Count, Created, Actions
- "Create Group" button
- Search by name

**Row Actions:**
- Edit (dialog)
- Manage Members (dialog)
- Delete (confirmation)

### 2. `src/pages/groups/group-create-dialog.tsx`

Create/edit group dialog:
- Group Name (required)
- Description (textarea)
- Metadata (key-value pairs, advanced — hidden behind "Advanced" toggle)
- Submit/Cancel

### 3. `src/pages/groups/group-members-dialog.tsx`

Group members dialog:
- Current members list with remove button
- "Add Member" search/select
  - Search users by name/email
  - Select from results
  - Click "Add"
- Save changes

### 4. `src/hooks/groups.ts`

Custom hooks for groups data fetching.

## UI/UX Requirements

- Reuse DataTable component
- Member management: two-panel layout (available users / group members)
- Search users when adding members
- Remove member with confirmation
- Delete group: confirmation with "This will remove all group memberships"
- Loading/empty states consistent with other pages

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/groups` loads with group list
2. Create group with name and description
3. Edit group
4. Add members to group (search and select users)
5. Remove member from group
6. Delete group
