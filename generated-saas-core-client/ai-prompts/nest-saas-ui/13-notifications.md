# Prompt 13 — Notifications & Notification Templates

## Task

Build the Notifications module: manage notification templates, broadcast notifications to users, and view sent notifications.

## API Hooks Used

### Notifications

From `@/lib/api/wms-saas-core-api/notifications/notifications`:
- `NotificationController_getNotifications` (GET /notifications with params)
- `NotificationController_getNotification` (GET /notifications/:id) — if available
- `NotificationController_markAsRead` (PATCH /notifications/:id/read) — if available
- `NotificationController_markAllAsRead` (PATCH /notifications/read-all) — if available
- `NotificationController_delete` (DELETE /notifications/:id) — if available
- `NotificationController_broadcast` (POST /notifications/broadcast)

Types: `BroadcastNotificationDto`, `NotificationControllerGetNotificationsParams`

### Notification Templates

From `@/lib/api/wms-saas-core-api/notification-templates/notification-templates`:
- `NotificationTemplateController_findAll` (GET /notification-templates)
- `NotificationTemplateController_create` (POST /notification-templates)
- `NotificationTemplateController_findOne` (GET /notification-templates/:id)
- `NotificationTemplateController_update` (PATCH /notification-templates/:id)
- `NotificationTemplateController_delete` (DELETE /notification-templates/:id)

## Files to Create

### 1. `src/pages/notifications/notifications-list.tsx`

Sent notifications list page:
- Table columns: Notification Type, Subject, Recipients Count, Channel (email, in-app, sms), Status, Sent At, Actions
- Filter by type
- Filter by channel
- Filter by date range
- Search by subject
- Pagination
- "Send Broadcast" button

**Row Actions:**
- View Details (dialog)
- Resend (if failed) — if available

### 2. `src/pages/notifications/broadcast-dialog.tsx`

Broadcast notification dialog:
- Subject (required)
- Body/Message (rich text or textarea)
- Channel (select: email, in-app, sms, all)
- Target Users (select: all, specific roles, specific groups, specific tenants)
  - If "specific" → searchable multi-select
- Priority (normal, high, urgent)
- Schedule (optional date-time for delayed send)
- Preview button
- Send/Cancel

### 3. `src/pages/notification-templates/templates-list.tsx`

Notification templates list:
- Table columns: Template Name, Channel, Event Type, Last Updated, Actions
- "Create Template" button
- Search by name

**Row Actions:**
- Edit (opens form)
- Preview (shows rendered template)
- Duplicate
- Delete

### 4. `src/pages/notification-templates/template-form-dialog.tsx`

Create/edit notification template dialog:
- Template Name (required)
- Channel (select: email, in-app, sms)
- Event Type (select or text input)
- Subject template (with variable support, e.g., `{{userName}}`)
- Body template (textarea with variable support)
- Variables hint: list of available variables for this event type
- Save/Cancel

### 5. `src/hooks/notifications.ts` & `src/hooks/notification-templates.ts`

Custom hooks.

## UI/UX Requirements

- Broadcast dialog: two-step (select targets → compose message)
- Template variables: highlight/badge style `{{variableName}}` in the text
- Notification status: sent (green), failed (red), pending (amber), scheduled (blue)
- Channel badges: email (blue), in-app (green), sms (purple)
- Notification detail: show full message, recipient list, delivery status per recipient (if available)
- Empty state: "No notifications sent yet"
- Broadcast with large recipient count should show a progress indicator

## Notification Inbox (for the bell icon in header)

Create a small notification dropdown component:
- `src/components/features/notifications/notification-bell.tsx`
- Shows unread count badge on bell icon
- Click opens dropdown with last 5 notifications
- "Mark all as read" link
- "View all" link to full notification list
- Each notification: icon, title, timestamp

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/notifications` loads sent notifications
2. Send broadcast notification
3. Filter notifications by channel
4. `/notification-templates` loads templates
5. Create template with variables
6. Edit template
7. Preview template
8. Delete template
9. Bell icon in header shows unread count
10. Notification dropdown shows recent items
