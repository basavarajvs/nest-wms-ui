# Prompt 12 — API Keys & Webhooks

## Task

Build the API Keys and Webhooks management modules.

## API Hooks Used

### API Keys

From `@/lib/api/wms-saas-core-api/api-keys/api-keys`:
- `ApiKeyController_findAll` (GET /api-keys with params)
- `ApiKeyController_create` (POST /api-keys)
- `ApiKeyController_findOne` (GET /api-keys/:id) — if available
- `ApiKeyController_update` (PATCH /api-keys/:id) — if available
- `ApiKeyController_remove` (DELETE /api-keys/:id)
- `ApiKeyController_updateScopes` (PATCH /api-keys/:id/scopes) — if available

Types: `CreateApiKeyDto`, `UpdateApiKeyScopesDto`, `ApiKeyControllerFindAllParams`

### Webhooks

From `@/lib/api/wms-saas-core-api/webhooks/webhooks`:
- `WebhookController_create` (POST /webhooks/endpoints)
- `WebhookController_findAll` (GET /webhooks/endpoints)
- `WebhookController_findOne` (GET /webhooks/endpoints/:id)
- `WebhookController_update` (PATCH /webhooks/endpoints/:id)
- `WebhookController_remove` (DELETE /webhooks/endpoints/:id)
- `WebhookController_listEvents` (GET /webhooks/events with params)
- `WebhookController_listDeliveries` (GET /webhooks/deliveries with params)
- `WebhookController_retryDelivery` (POST /webhooks/deliveries/:id/retry)

Types: `CreateWebhookEndpointDto`, `UpdateWebhookEndpointDto`, `WebhookControllerListEventsParams`, `WebhookControllerListDeliveriesParams`

## Files to Create

### 1. `src/pages/api-keys/api-keys-list.tsx`

API Keys list page:
- Table columns: Key Name, Key Prefix (first few chars), Scopes, Status, Last Used, Created, Actions
- "Create API Key" button
- Search by name

**Row Actions:**
- Copy Key (show full key once, in a dialog with copy button)
- Edit Scopes
- Revoke/Delete (confirmation)
- View Usage (if available)

**Important Security UX:**
- When creating, show the full key ONCE with a warning: "Copy this key now. You won't be able to see it again."
- Store the full key in the create response to display

### 2. `src/pages/api-keys/api-key-create-dialog.tsx`

Create API key dialog:
- Key Name (required)
- Scopes (multi-select or comma-separated input)
- Expiration (optional date)
- Submit → shows key display modal with copy button
- Close after user confirms they've copied the key

### 3. `src/pages/api-keys/api-key-scopes-dialog.tsx`

Update scopes dialog:
- Current scopes displayed
- Scope input (comma-separated or tag-style)
- Save/Cancel

### 4. `src/pages/webhooks/webhooks-list.tsx`

Webhook endpoints list page:
- Table columns: URL, Description, Events Subscribed, Status, Secret (masked), Created, Actions
- "Create Endpoint" button
- Search by URL

**Row Actions:**
- Edit
- View Events (navigate to events for this endpoint)
- Test (send test event)
- Delete

### 5. `src/pages/webhooks/webhook-create-dialog.tsx`

Create/edit webhook endpoint dialog:
- URL (required, validate URL format)
- Description
- Events (multi-select from available event types)
- Secret (auto-generated, can regenerate)
- Status toggle (Active/Inactive)
- Submit/Cancel

### 6. `src/pages/webhooks/webhook-events.tsx`

Webhook events page:
- Table columns: Event ID, Event Type, Endpoint, Status (delivered/pending/failed), Created, Actions
- Filter by event type
- Filter by status
- Pagination

**Row Actions:**
- View Payload (dialog with JSON display)
- Redeliver (if failed)

### 7. `src/pages/webhooks/webhook-deliveries.tsx`

Webhook deliveries page (or tab within event detail):
- Table columns: Delivery ID, Status, HTTP Status, Attempt #, Duration, Created
- Filter by status
- Click to view request/response details

### 8. `src/hooks/api-keys.ts` & `src/hooks/webhooks.ts`

Custom hooks.

## UI/UX Requirements

- API Key creation: two-step dialog (form → show key with copy)
- Copy button uses `navigator.clipboard.writeText()`
- Webhook event payload: syntax-highlighted JSON viewer
- Webhook delivery: show request and response headers/body in expandable sections
- Status indicators for deliveries: delivered (green), failed (red), pending (amber)
- Retry button only enabled for failed deliveries
- Delete confirmation for both API keys and webhooks

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/api-keys` loads with key list
2. Create API key → shows key once, copy works
3. Edit scopes
4. Revoke/delete key
5. `/webhooks` loads with endpoint list
6. Create webhook endpoint with URL and events
7. Edit endpoint
8. View events for an endpoint
9. View delivery details
10. Retry failed delivery
