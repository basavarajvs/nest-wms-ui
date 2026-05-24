# Prompt 15 — Reports & Audit Logs

## Task

Build the Reports module and Audit Logs viewer.

## API Hooks Used

### Reports

From `@/lib/api/wms-saas-core-api/reports/reports`:
- `ReportController_findAll` (GET /reports with params)
- `ReportController_create` (POST /reports)
- `ReportController_findOne` (GET /reports/:id)
- `ReportController_update` (PATCH /reports/:id)
- `ReportController_delete` (DELETE /reports/:id)
- `ReportController_generate` (POST /reports/:id/generate) — trigger generation
- `ReportController_download` (GET /reports/:id/download) — if available
- `ReportController_schedule` (POST /reports/:id/schedule) — if available

Types: `CreateReportDto`, `CreateReportDtoParameters`, `CreateReportDtoSchedule`, `ReportControllerFindAllParams`, `ReportScheduleDto`

### Audit Logs

From `@/lib/api/wms-saas-core-api/audit/audit`:
- `AuditController_query` (GET /audit?params) — query audit logs
- `AuditController_export` (GET /audit/export?params) — export audit logs

Types: `AuditControllerQueryParams`, `AuditControllerExportParams`

From `@/lib/api/wms-saas-core-api/system-admin/system-admin`:
- `SystemAdminController_getAudit` (system-wide audit query) — if available

Check the generated files for exact function names as they may differ.

## Files to Create

### 1. `src/pages/reports/reports-list.tsx`

Reports list page:
- Table columns: Report Name, Type, Parameters Summary, Schedule (if any), Last Generated, Status, Actions
- "Create Report" button
- Search by name
- Filter by type
- Filter by status

**Report Status Badges:**
- Ready → green
- Generating → amber (with spinner)
- Failed → red
- Scheduled → blue

**Row Actions:**
- View/Download Report
- Generate Now (triggers generation)
- Edit Configuration
- Set Schedule
- Delete

### 2. `src/pages/reports/report-form-dialog.tsx`

Create/edit report dialog:
- Report Name (required)
- Report Type (select: users, tenants, subscriptions, audit, billing, custom)
- Parameters (dynamic form based on type):
  - Date range (start/end date pickers)
  - Filters (key-value pairs or structured inputs)
  - Format (PDF, CSV, Excel, JSON)
- Schedule toggle:
  - Recurrence (daily, weekly, monthly, on-demand)
  - Day of week/month
  - Time
- Save/Cancel

### 3. `src/pages/reports/report-view-dialog.tsx`

Report view dialog:
- Shows report metadata (name, type, parameters, generated at)
- Preview content (if data is returned inline) or download button
- For table reports: show first N rows as preview
- Download button (PDF/CSV/Excel)
- "Regenerate" button

### 4. `src/pages/audit/audit-logs.tsx`

Audit logs page:
- Table columns: Timestamp, Actor (user email/name), Action, Resource Type, Resource ID, Tenant, IP Address, Status
- Advanced filtering:
  - Date range picker (required)
  - Actor search
  - Action type filter
  - Resource type filter
  - Tenant filter (searchable dropdown)
  - Status filter (success, failure)
- Search across all fields
- Pagination with page size selector (20, 50, 100)
- "Export" button (CSV download)

**Row Actions:**
- View Details (expandable row or dialog showing full audit entry including diff/changes)
- Copy Request ID

### 5. `src/pages/audit/audit-detail-dialog.tsx`

Audit entry detail dialog:
- All fields displayed in a structured view
- "Changes" section: show before/after diff if available (JSON diff)
- Request ID (copyable)
- Metadata: IP, user agent, timestamp
- Related entries link (same correlation ID)

### 6. `src/hooks/reports.ts` & `src/hooks/audit.ts`

Custom hooks.

## UI/UX Requirements

- Audit logs: most data-heavy page. Use virtual scrolling if needed for large datasets
- Audit date range is required to prevent accidental full-table scans
- Export button triggers file download
- Report generation: show progress indicator during generation
- Report preview: for CSV/JSON show in a data table format
- Audit details: use JSON diff library or format changes as side-by-side
- Empty audit: "No audit entries match your filters"
- Empty reports: "No reports configured"

## Verification

```bash
pnpm run dev
```

Test scenarios:
1. `/reports` loads with report list
2. Create report with type and parameters
3. Set schedule on report
4. Trigger report generation
5. View generated report (preview/download)
6. Delete report
7. `/audit` loads with audit log entries
8. Date range filter works
9. Filter by actor, action, resource type
10. View audit detail with changes
11. Export audit logs (CSV download)
12. Pagination on large result sets
