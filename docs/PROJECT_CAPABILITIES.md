# WMS Backend — Project Capabilities Document

> **Document purpose:** A single, authoritative reference describing every capability of the `new-wmsbackend` platform. It is intended as the source-of-truth for follow-on User Documentation, UI development, and customer-facing documentation.
>
> **Scope rule:** This document describes *only* capabilities that exist in the current codebase at `/home/raju/Project/Nest/SaasCore/new-wmsbackend`. It does **not** assume features that are not implemented. Where a capability is only partially implemented or is a known gap, that is stated explicitly.
>
> **Manhattan WMS alignment:** Every operational domain in this platform is benchmarked against the **Manhattan WMS RF Operations** reference suite (`Manhattan_RF_Operations_Suite_v1/`, 20 documents). Each domain section below contains a "Manhattan WMS alignment" subsection that cites the specific RF menu flow being emulated and the gaps that remain. See **Appendix A** for the consolidated Manhattan mapping.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Authentication](#4-authentication)
5. [Authorization — RBAC, Roles, Permissions](#5-authorization--rbac-roles-permissions)
6. [Multi-Tenancy](#6-multi-tenancy)
7. [Cross-Cutting Infrastructure](#7-cross-cutting-infrastructure)
8. [RF (Handheld Scanner) Platform](#8-rf-handheld-scanner-platform)
9. [Web (Admin Console) Platform](#9-web-admin-console-platform)
10. [Domain: Warehouse & Facility Structure](#10-domain-warehouse--facility-structure)
11. [Domain: Master Data](#11-domain-master-data)
12. [Domain: Inbound — Receiving](#12-domain-inbound--receiving)
13. [Domain: Inbound — Quality Inspection](#13-domain-inbound--quality-inspection)
14. [Domain: Inbound — Putaway](#14-domain-inbound--putaway)
15. [Domain: Inventory](#15-domain-inventory)
16. [Domain: Inventory — Cycle Count](#16-domain-inventory--cycle-count)
17. [Domain: Inventory — Replenishment](#17-domain-inventory--replenishment)
18. [Domain: Outbound — Sales Orders & Allocation](#18-domain-outbound--sales-orders--allocation)
19. [Domain: Outbound — Picking & Waves](#19-domain-outbound--picking--waves)
20. [Domain: Outbound — Packing](#20-domain-outbound--packing)
21. [Domain: Outbound — Staging](#21-domain-outbound--staging)
22. [Domain: Outbound — Shipping](#22-domain-outbound--shipping)
23. [Domain: Outbound — Value-Added Services (VAS)](#23-domain-outbound--value-added-services-vas)
24. [Domain: Quality Management](#24-domain-quality-management)
25. [Domain: Transfers](#25-domain-transfers)
26. [Domain: Work Orders](#26-domain-work-orders)
27. [Domain: Labor Management](#27-domain-labor-management)
28. [Domain: Equipment Management](#28-domain-equipment-management)
29. [Domain: Dock-Yard Management](#29-domain-dock-yard-management)
30. [Domain: Exceptions Management](#30-domain-exceptions-management)
31. [Domain: Billing](#31-domain-billing)
32. [Domain: Fulfillment Workflow & Billing](#32-domain-fulfillment-workflow--billing)
33. [Domain: Workflow Engine (BPMN / State Machine / Rules)](#33-domain-workflow-engine-bpmn--state-machine--rules)
34. [Domain: Integrations](#34-domain-integrations)
35. [Domain: Reports](#35-domain-reports)
36. [Domain: Analytics & KPIs](#36-domain-analytics--kpis)
37. [Domain: Observability](#37-domain-observability)
38. [Domain: Settings](#38-domain-settings)
39. [Domain: Security — Supervisor PIN](#39-domain-security--supervisor-pin)
40. [Domain: Health & Lifecycle](#40-domain-health--lifecycle)
41. [Data Model Summary](#41-data-model-summary)
42. [OpenAPI / Client Generation](#42-openapi--client-generation)
43. [Appendix A — Manhattan WMS RF Menu Mapping](#43-appendix-a--manhattan-wms-rf-menu-mapping)
44. [Appendix B — Configuration Reference](#44-appendix-b--configuration-reference)
45. [Appendix C — Known Gaps & Limitations](#45-appendix-c--known-gaps--limitations)

---

## 1. Platform Overview

The **WMS Backend** (`new-wmsbackend`) is a multi-tenant, NestJS-based Warehouse Management System that serves as the **warehouse execution layer** within a larger SaaS ecosystem. It is designed to be operated by:

- **Warehouse operators** using **RF handheld scanners** (the "RF platform") for directed-work execution on the warehouse floor — receiving, putaway, picking, packing, staging, shipping, cycle counts, quality inspections, replenishment, transfers, equipment check-out, and labor clock-in/out.
- **Supervisors and administrators** using a **Web admin console** (the "Web platform") for master-data management, configuration, monitoring, exception resolution, approvals, billing, reporting, and operational control of the warehouse.

The platform is benchmarked against the **Manhattan WMS RF Operations Suite**. Each operational domain (Inbound Receiving, Quality Inspection, Putaway, Cycle Count, Outbound Picking, Packing, Staging, Shipping) follows the documented Manhattan RF step sequence and preserves Manhattan domain concepts (LPN, ASN, dock door, staging lane, wave, cluster pick, cartonization, multi-stop load, custody transfer, directed work / "Get Work", supervisor review, tolerance/approval gates).

### What the platform can do — at a glance

| Capability area | Status |
|---|---|
| Multi-tenant warehouse operations (tenant + facility scoping) | Implemented |
| JWT verification (tokens issued externally by SaaS Core) | Implemented |
| CASL-based RBAC (7 roles, 86 subjects, 31 actions) | Implemented |
| RF handheld session management (`x-rf-session-id`, 8-hour TTL, heartbeat) | Implemented |
| 175 RF endpoints across 25 RF controllers / 13 domains | Implemented |
| ~430 Web endpoints across 74 web controllers / 22 domains | Implemented |
| 184 Prisma models in a single `multitenant` PostgreSQL schema | Implemented |
| BullMQ background jobs (5 processors) | Implemented |
| OpenTelemetry tracing, Prometheus metrics, Pino structured logging | Implemented |
| Audit logging via global `AuditInterceptor` + `system_audit_log` | Implemented |
| RFC 7807 problem-details error responses | Implemented |
| Idempotency, rate-limiting, request semaphore, PII redaction interceptors | Implemented |
| Swagger / OpenAPI documentation at `/api/docs` | Implemented |
| Auto-generated TypeScript API client (Orval) from the live Swagger spec | Implemented |
| Graceful shutdown with connection draining | Implemented |
| Manhattan WMS RF workflow parity | Partial (see Appendix A & C) |

---

## 2. Architecture

### 2.1 High-level architecture

```
                    +-------------------------------------------+
                    |           SaaS Core (external)           |
                    |  - Identity / JWT issuance               |
                    |  - Tenant management                     |
                    |  - Role registry (system of record)      |
                    +-------------------+-----------------------+
                                        | JWT (Bearer)
                                        v
+---------------------------------------------------------------+
|                WMS Backend  (NestJS + Fastify)                |
|                                                               |
|  Global pipeline (per request):                               |
|   Middleware:  TenantResolution -> ShutdownDrain              |
|   Guards:      JwtAuthGuard -> CaslGuard -> QuotaGuard        |
|   Interceptors: Response -> PiiRedactor -> RequestSemaphore ->|
|                 Idempotency -> Audit                          |
|   Filter:      Rfc7807ExceptionFilter                         |
|                                                               |
|  +--------------+  +--------------+  +----------------------+ |
|  |  RF platform |  |  Web platform|  |  Background (BullMQ) | |
|  |  /rf/*       |  |  /web/*      |  |  - ASN import        | |
|  |  x-rf-session|  |  Bearer JWT  |  |  - Auto-approval     | |
|  |  -id header  |  |              |  |  - Workflow recovery | |
|  |              |  |              |  |  - Report generation | |
|  |              |  |              |  |  - Quota sync retry  | |
|  +-------+------+  +-------+------+  +-----------+----------+ |
|          |                 |                     |            |
|          +-----------+-----+---------------------+            |
|                      v                                      |
|         +------------------------------------------+         |
|         |   33 feature modules (src/*)            |         |
|         |   - inbound, outbound, inventory        |         |
|         |   - quality, warehouse, billing         |         |
|         |   - workflow, labor, equipment          |         |
|         |   - ... (see sections 10-40)            |         |
|         +------------------+-----------------------+         |
|                            v                                 |
|         +------------------------------------------+         |
|         |  PrismaService (Prisma 5.22)            |         |
|         |  AsyncLocalStorage tenant ctx           |         |
|         |  Row-Level Security (PG RLS)            |         |
|         +------------------+-----------------------+         |
+-----------------------------+-------------------------------+
                              v
            +----------------------------------+
            | PostgreSQL (schema: multitenant) |
            |  - 184 models                    |
            |  - 41 enums                      |
            |  - tenant_id on ~178 models      |
            +----------------------------------+

            +----------------------------------+
            | Redis                            |
            |  - BullMQ backend                |
            |  - Cache (TTLs)                  |
            |  - Rate-limit store              |
            |  - Pub/sub                       |
            +----------------------------------+
```

### 2.2 Module organization

The codebase is organized as **33 feature modules** under `src/`, each registered in `src/app.module.ts`. Each operational module typically follows the RF/Web split convention:

```
src/<domain>/
  <subdomain>/
    rf/               # RF handheld controller (POST-only, x-rf-session-id)
      *.controller.ts
    web/              # Web admin controller (Bearer JWT, CASL-guarded)
      *.controller.ts
    *.service.ts      # Shared business logic
    dtos/             # Data transfer objects
  <domain>.module.ts
```

Modules with **no controllers** (pure infrastructure / cross-cutting): `casl`, `cluster`, `quota`, `lifecycle`, `core-client`, `seed`, `common`, `prisma`, `config`.

### 2.3 Application bootstrap (`src/main.ts:18-61`)

- Uses **Fastify** adapter (not Express) via `NestFastifyApplication`.
- Global API prefix: `api/v1/wms` (configurable via `API_PREFIX`).
- Registers **Helmet** (CSP in production) and **rate-limit** (Redis-backed, 100 requests / 60s default).
- **Swagger UI** at `http://localhost:3002/api/docs` when `SWAGGER_ENABLED=true`.
- **BigInt JSON serialization** patched globally (`BigInt.prototype.toJSON` -> `.toString()`).
- Listens on port `3002` (configurable via `PORT`), bound to `0.0.0.0`.
- Shutdown hooks enabled (`app.enableShutdownHooks()`).

### 2.4 Global guards, interceptors, filters, middleware (`src/app.module.ts:127-163`)

| Layer | Component | File | Purpose |
|---|---|---|---|
| Middleware | `TenantResolutionMiddleware` | `src/common/middleware/tenant-resolution.middleware.ts` | Decodes JWT (unsigned) to extract `tenantId/tenantCode/tenantStatus` before guards run |
| Middleware | `ShutdownDrainMiddleware` | `src/lifecycle/shutdown-drain.middleware.ts` | Rejects new requests during graceful shutdown |
| Guard (APP_GUARD) | `JwtAuthGuard` | `src/common/auth/jwt-auth.guard.ts` | Verifies Bearer JWT signature, populates `req.user`, `req.tenantContext`, `req.ability`, `req.tokenId` |
| Guard (APP_GUARD) | `CaslGuard` | `src/common/guards/casl.guard.ts` | Reads `@CheckAbility` metadata, checks `ability.can(action, subject)` |
| Guard (APP_GUARD) | `QuotaGuard` | `src/common/guards/quota.guard.ts` | Reads `@QuotaCheck` metadata, checks `multitenant.resource_quotas` |
| Filter (APP_FILTER) | `Rfc7807ExceptionFilter` | `src/common/filters/rfc7807-exception.filter.ts` | Returns RFC 7807 problem+json error responses |
| Interceptor | `ResponseInterceptor` | `src/common/interceptors/response.interceptor.ts` | Wraps responses in a standard envelope |
| Interceptor | `PiiRedactorInterceptor` | `src/common/interceptors/pii-redactor.interceptor.ts` | Redacts PII fields from logs/responses |
| Interceptor | `RequestSemaphoreInterceptor` | `src/common/interceptors/request-semaphore.interceptor.ts` | Limits concurrent in-flight requests per tenant |
| Interceptor | `IdempotencyInterceptor` | `src/common/interceptors/idempotency.interceptor.ts` | Idempotent POST handling (TTL 300s default) |
| Interceptor | `AuditInterceptor` | `src/observability/audit/audit.interceptor.ts` | Writes to `system_audit_log` for audited actions |

### 2.5 Background jobs (BullMQ)

Five BullMQ processors are registered:

| Processor | File | Purpose |
|---|---|---|
| `asn-import.processor.ts` | `src/inbound/asn/` | Async ASN document import & parsing |
| `auto-approval.processor.ts` | `src/inventory/approvals/` | Auto-approve inventory adjustments meeting thresholds |
| `workflow-recovery.processor.ts` | `src/workflow/orchestrator/` | Recover failed workflow executions |
| `report.processor.ts` | `src/reports/` | Async report generation |
| `quota-sync-retry.processor.ts` | `src/quota/` | Retry quota sync to SaaS Core |

BullMQ is configured with 3 retries, exponential backoff (5s base), and a rate limiter (50 jobs / 5s).

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | v23+ |
| Framework | NestJS | 11.x |
| HTTP adapter | Fastify (`@nestjs/platform-fastify`) | 5.9 |
| Language | TypeScript | 5.7 (strict) |
| ORM | Prisma | 5.22 (with `multiSchema` preview) |
| Database | PostgreSQL | (schema: `multitenant`) |
| Queue / cache | BullMQ + ioredis | 5.79 / 5.11 |
| Auth | `jsonwebtoken` (verify-only) | 9.x |
| Authorization | `@casl/ability` | 7.x |
| Validation | `class-validator` + `class-transformer`, `zod`, `joi` | 0.15 / 4.x / 18.x |
| API docs | `@nestjs/swagger` | 11.x |
| Security | `@fastify/helmet`, `@fastify/rate-limit` | 13 / 11 |
| Logging | `nestjs-pino` + `pino-pretty` | 4.6 / 13.x |
| Observability | OpenTelemetry SDK, `@willsoto/nestjs-prometheus` | 0.220 / 6.x |
| Workflow engines | `xstate`, `@gorules/zen-engine`, `bpmn-engine`, `camunda-bpmn-moddle` | 5.32 / 0.54 / 25.x / 7.x |
| Events | `@nestjs/event-emitter` (wildcard, `.` delimiter) | 3.x |
| Scheduling | `@nestjs/schedule` (cron) | 6.x |
| Cloud | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | 3.1079 |
| Spreadsheets | `exceljs`, `csv-stringify` | 4.4 / 6.8 |
| Testing | Jest, supertest | 30 / 7.x |
| Package manager | pnpm | (with `pnpm-workspace.yaml`) |

---

## 4. Authentication

### 4.1 Token issuance — external

**The WMS backend does NOT issue JWTs.** Authentication (login, credential validation, refresh-token rotation) is handled by an external **SaaS Core** service. The WMS backend only **verifies** JWTs.

This is explicitly stated in `.env:13`:
```
# -- Auth (JWT verification -- tokens issued by SaaS Core) --
```

There is no `@Controller('auth')`, no `JwtModule`, no `JwtService.signAsync`, and no login endpoint in this codebase. (Search confirmed zero matches.)

### 4.2 Token verification (`src/common/auth/jwt-auth.guard.ts`)

- **Format:** JWT (3-part), Bearer scheme: `Authorization: Bearer <token>`.
- **Verification:** `jsonwebtoken.verify(token, currentSecret)` — `jwt-auth.guard.ts:51`.
- **Secret:** `ConfigService.get('JWT_ACCESS_SECRET')` (Joi-validated, min 8 chars, required).
- **Secret rotation:** Supports an old secret via `JWT_ACCESS_SECRET_OLD`. `JwtValidationService.validateToken` returns `{ valid, useOld }` and the guard uses the old secret to verify if `useOld` is true.
- **Validation service** (`src/common/auth/jwt-validation.service.ts:7-20`): decodes the payload (base64) and checks `iat` exists. Does not perform real revocation lookup (despite the guard's "Token revoked or expired" error message).
- **Refresh tokens:** `JWT_REFRESH_SECRET` and `JWT_REFRESH_EXPIRY=7d` exist in config but are handled by SaaS Core, not this app.
- **Access token expiry:** `JWT_ACCESS_EXPIRY=15m` (default).

### 4.3 JWT payload claims

| Claim | Type | Used for |
|---|---|---|
| `sub` | string (UUID) | User ID — `req.user?.sub` |
| `tenantId` | string (UUID) | Multi-tenant routing |
| `tenantCode` | string | Tenant code |
| `tenantStatus` | string | Tenant status (default `'active'`) |
| `roles` | string[] | Role codes for CASL ability construction |
| `permissions` | string[] / `{code}[]` | Fine-grained `RESOURCE:ACTION` codes |
| `jti` | string | Token ID -> `req.tokenId` |
| `iat` | number | Issued-at (must be present) |
| `authMethod` | string | If `'pin'`, restricts abilities (read/validate-only) |

### 4.4 Public endpoints (`@Public()`)

Any route can opt out of JWT auth via the `@Public()` decorator (`src/common/decorators/public.decorator.ts:4`), honored by `JwtAuthGuard` at `jwt-auth.guard.ts:27-31`. The only documented public endpoint is the health check (`GET /api/v1/wms/health`).

### 4.5 RF session authentication

RF handheld devices use a **two-layer auth model**:

1. **First:** A valid SaaS-Core JWT (verified by `JwtAuthGuard`) is required to call `POST /rf/session/login`.
2. **Then:** The RF session is created and a `session_token` is returned. Subsequent RF calls carry `x-rf-session-id: <session-id>` header, validated by `RfSessionGuard`.

See **section 8 (RF Platform)** for full details.

---

## 5. Authorization — RBAC, Roles, Permissions

Authorization is implemented with **CASL** (`@casl/ability` v7) using `MongoAbility`.

### 5.1 Subjects (86 + wildcard)

Defined in `src/casl/casl.types.ts:37-124`. The `WmsSubjects` union has **87 entries** (1 wildcard `'all'` + 86 named subjects):

`WarehouseFacility`, `WarehouseZone`, `StorageLocation`, `Product`, `ProductCategory`, `UnitOfMeasure`, `ProductAttribute`, `ProductBarcode`, `Inventory`, `PurchaseOrder`, `Task`, `CycleCount`, `Adjustment`, `Report`, `InventoryOnHand`, `InventoryTransaction`, `InventoryLot`, `InventoryHold`, `InventoryAdjustment`, `InventoryPolicy`, `AdvanceShipNotice`, `GoodsReceipt`, `LPN`, `PutawayTask`, `SalesOrder`, `InventoryAllocation`, `PickingWave`, `PickingTask`, `PackingSession`, `PackingContainer`, `OutboundShipment`, `InventoryTransfer`, `InventoryTransferLine`, `CycleCountLine`, `AdjustmentApproval`, `ApprovalThresholdConfig`, `SystemSetting`, `Replenishment`, `Integration`, `Barcode`, `ExternalEntityMapping`, `IntegrationSyncLog`, `SyncWebhookLog`, `VasServiceCatalog`, `VasWorkstation`, `QualityInspection`, `ComplianceRequirement`, `ComplianceAudit`, `HazmatMaterial`, `StorageRateMaster`, `StorageClientRate`, `BillingCycle`, `StorageInventorySnapshot`, `StorageCharge`, `ClientInvoice`, `DockAppointment`, `YardVehicle`, `LaborShift`, `LaborShiftAssignment`, `LaborTimeLog`, `LaborPerformanceMetric`, `WarehouseEquipment`, `EquipmentMaintenance`, `WorkOrder`, `WorkOrderOperation`, `WorkOrderComponent`, `ExceptionManagement`, `ExceptionComment`, `ExceptionEscalationRule`, `WarehouseEvent`, `SystemAuditLog`, `DailyKpiMetric`, `LocationPickHeatmap`, `FulfillmentWorkflowEvent`, `FulfillmentWorkflowTransition`, `FulfillmentBillingRun`, `FulfillmentBillingEvent`, `RfSession`, `SupervisorPin`, `ResourceQuota`, `Quota`, `CartonizationRule`, `PackingException`, `StagingLane`, `Trailer`, `Manifest`.

### 5.2 Actions (31)

Defined in `src/casl/casl.types.ts:3-35`, the `WmsAction` enum:

`Manage`, `Create`, `Read`, `Update`, `Delete`, `List`, `Receive`, `ExecutePutaway`, `PerformQc`, `Pick`, `Pack`, `Ship`, `Release`, `ShortPick`, `Reallocate`, `Cancel`, `Adjust`, `Count`, `Approve`, `Transact`, `InitiateTransfer`, `ReceiveTransfer`, `ExecuteCycleCount`, `ApproveAdjustment`, `ManageCycleCountSchedule`, `OverrideApproval`, `Validate`, `Lookup`, `TriggerSync`, `ViewWebhookLogs`, `RegisterDevice`.

### 5.3 Roles (7)

Six roles are defined in `WMS_ROLE_DEFINITIONS` (`src/casl/permission-registry.ts:13-108`), plus `TENANT_ADMIN` is special-cased in the ability factory (`src/casl/wms-ability.factory.ts:19-27`):

| Role | Defined at | Capabilities |
|---|---|---|
| `WAREHOUSE_ADMIN` | `permission-registry.ts:15` | `Manage 'all'` — full access |
| `WAREHOUSE_SUPERVISOR` | `permission-registry.ts:21` | Read all + approve adjustments/counts/tasks, adjust inventory, receive POs/GRs/LPNs, putaway, perform QC, release waves, short-pick, trigger sync, view webhook logs, register devices, manage cycle-count schedules |
| `WAREHOUSE_OPERATOR` | `permission-registry.ts:48` | Read products/facilities/zones/locations/inventory/orders; receive POs; pick/pack/ship; adjust/transact inventory; pick tasks; pack sessions; execute cycle counts; initiate/receive transfers; validate barcodes; lookup products/locations/LPNs |
| `SYSTEM_ADMIN` | `permission-registry.ts:76` | `Manage 'all'` — full access |
| `SCANNER_USER` | `permission-registry.ts:82` | Validate barcodes; lookup products/locations/LPNs/inventory; read products/locations |
| `INVENTORY_CLERK` | `permission-registry.ts:94` | Read/create products; read locations/inventory; count cycle counts; adjust inventory; validate barcodes; lookup products/locations/LPNs |
| `TENANT_ADMIN` | `wms-ability.factory.ts:19` | `Manage 'all'` (special-cased, not in registry) |

> **Note:** Roles are **not stored in the WMS database**. The role registry is the code constant `WMS_ROLE_DEFINITIONS`. The `WmsRoleSeederService` (`src/seed/wms-role-seeder.service.ts:22-35`) pushes these definitions to SaaS Core via `CoreClientService.seedWmsRoles(tenantId, roles)` -> `POST /api/tenants/{tenantId}/roles`. SaaS Core is the system of record for roles; the WMS backend mirrors the definitions in code to build abilities locally.

### 5.4 Ability construction (`src/casl/wms-ability.factory.ts:11-78`)

`WmsAbilityFactory.createForUser(jwtPayload)` algorithm:

1. **`TENANT_ADMIN` short-circuit** — grants `Manage 'all'` and returns.
2. **Role registry expansion** — for each role in `jwtPayload.roles` that matches a `WMS_ROLE_DEFINITIONS` entry, grants `can(action, subject)`. `Manage` on a non-`'all'` subject expands to `Create, Read, Update, Delete`.
3. **Fine-grained permission codes** — parses `jwtPayload.permissions` entries of form `'RESOURCE:ACTION'` (or `{ code }` objects), matches the resource against `ALL_WMS_SUBJECTS` (case-insensitive), maps the action via `mapAction()`, and grants it.
4. **`authMethod === 'pin'` restriction** — if the JWT was issued via PIN auth, explicitly `cannot(Delete/Create/Update/Approve, 'all')` — a supervisor-PIN session is read/validate-only.

### 5.5 Applying authorization to controllers

- **Decorator:** `@CheckAbility({ action, subject })` — `src/common/decorators/check-ability.decorator.ts:10`.
- **Guard:** `CaslGuard` (`src/common/guards/casl.guard.ts:15`) reads metadata, builds an ability, checks `ability.can(action, subject)`, throws `ForbiddenException('Insufficient permissions: cannot ... ...')` on failure, and assigns `req.ability`.
- **Usage styles:** Either `@CheckAbility({ action: WmsAction.Create, subject: 'SupervisorPin' })` (enum) or `@CheckAbility({ action: 'create', subject: 'Equipment' })` (string literal — works because `WmsAction` enum values are lowercase strings).

### 5.6 Startup validation (`src/app.module.ts:143-159`)

On bootstrap, `AppModule.onApplicationBootstrap` validates that every subject referenced in `WMS_ROLE_DEFINITIONS` is present in `ALL_WMS_SUBJECTS`. Mismatches log a warning. This prevents silent permission gaps when new subjects are added to roles but not to the registry.

---

## 6. Multi-Tenancy

### 6.1 Tenant identity source

Tenant identity comes **exclusively from the JWT payload** — never from a header or subdomain. The `tenantId` claim is read by two cooperating mechanisms:

1. **`TenantResolutionMiddleware`** (`src/common/middleware/tenant-resolution.middleware.ts:10`) — runs **before** guards. Decodes the JWT **without signature verification** to read `tenantId/tenantCode/tenantStatus` and sets `req.tenantContext = { getTenantId: () => store.tenantId }`. This lets downstream services know the tenant even before full JWT verification.
2. **`JwtAuthGuard`** re-derives `req.tenantContext` from the **verified** payload (`jwt-auth.guard.ts:56-61`).

There is **no `x-tenant-id` header** in use. The only custom auth header is `x-rf-session-id`.

### 6.2 Tenant context propagation

`TenantContextService` (`src/common/context/tenant-context.service.ts:12`) wraps an `AsyncLocalStorage<TenantStore>` with `getTenantId()` that throws `UnauthorizedException('Tenant context not found')` if absent. It also supports a "system" context (`runAsSystem`, `:40-50`) for background jobs.

Throughout controllers the tenant is read as `req.tenantContext.getTenantId()` or via the `@CurrentTenant()` param decorator (`src/common/decorators/current-tenant.decorator.ts:3`).

### 6.3 Database-level isolation

- **~178 of 184 Prisma models** carry a `tenant_id` column (`String @db.Uuid`).
- Composite unique constraint pattern `@@unique([tenant_id, facility_id, <business_key>])` is pervasive.
- Many models carry `/// row level security` migration comments, indicating PostgreSQL RLS policies are used for tenant isolation at the DB level.
- Two-level scoping: most operational data is scoped by `(tenant_id, facility_id)`; `warehouse_facilities` is the central hub referenced by ~90 relations.

---

## 7. Cross-Cutting Infrastructure

### 7.1 Response envelope

`ResponseInterceptor` wraps all responses in a standard envelope structure. (UI developers should expect a consistent top-level shape on every successful response.)

### 7.2 Error format — RFC 7807

`Rfc7807ExceptionFilter` returns **RFC 7807 problem+json** error responses. Error bodies follow the `application/problem+json` media type with `type`, `title`, `status`, `detail`, `instance` fields.

### 7.3 Idempotency

`IdempotencyInterceptor` (`IDEMPOTENCY_TTL_MS=300000` default) provides idempotent POST handling — a request with an idempotency key is processed once; subsequent identical requests return the cached response.

### 7.4 Rate limiting

`@fastify/rate-limit` registered globally, Redis-backed: **100 requests / 60 seconds** per client (configurable via `RATE_LIMIT_GLOBAL_LIMIT` / `RATE_LIMIT_GLOBAL_TTL`).

### 7.5 Request semaphore

`RequestSemaphoreInterceptor` limits concurrent in-flight requests per tenant to protect the database pool.

### 7.6 PII redaction

`PiiRedactorInterceptor` redacts personally identifiable information from logs and responses.

### 7.7 Audit logging

`AuditInterceptor` (global) writes to the `system_audit_log` table for audited actions. The `@AuditLog({ eventType })` decorator (`src/common/decorators/audit-log.decorator.ts`) marks specific endpoints for audit. Currently only RF session login/logout and VAS workstation check-in/out use explicit `@AuditLog` at the controller layer; other actions are audited via the global interceptor or service-level logging.

### 7.8 Quota enforcement

`QuotaGuard` (global) reads `@QuotaCheck` metadata and checks `multitenant.resource_quotas` to enforce per-tenant resource limits. `QuotaModule` includes a `quota-sync-retry.processor.ts` BullMQ job for retrying quota sync to SaaS Core.

### 7.9 Event emitter

`@nestjs/event-emitter` with wildcard enabled and `.` delimiter. Used for domain event pub/sub within the application (e.g., status transitions triggering downstream handlers).

### 7.10 Scheduled jobs

`@nestjs/schedule` (`ScheduleModule.forRoot()`) provides cron-based scheduling. Used by the cycle-count scheduler and ABC reclassification engine.

---

## 8. RF (Handheld Scanner) Platform

The RF platform is the **directed-work execution surface** for warehouse floor operators. It is modeled on the Manhattan WMS RF Operations Suite.

### 8.1 RF session lifecycle

| Step | Endpoint | Description |
|---|---|---|
| Login | `POST /rf/session/login` | Requires a valid SaaS-Core JWT + `@CheckAbility({ action: Create, subject: 'RfSession' })`. Body: `{ facilityId, deviceId?, workflowType? }`. Returns `{ id, session_token, expires_at, workflow_type }`. Default workflow: `PICKING`. Default TTL: **480 minutes (8 hours)**. Inserts into `multitenant.db_rf_sessions` with `gen_random_uuid()` id. |
| Heartbeat | `POST /rf/session/heartbeat` | `@RfAction('read')`. Extends `expires_at = NOW() + 8 hours`. |
| Logout | `POST /rf/session/logout` | `@RfAction('delete')`. Sets `status='ENDED'`. |
| Current | `GET /rf/session/current` | `@RfAction('read')`. Returns current session info. (The only GET endpoint in the RF surface.) |

**File:** `src/rf/rf-session.controller.ts`. **Service:** `src/common/rf-session/rf-session.service.ts`.

### 8.2 RF session validation

`RfSessionGuard` (`src/rf/guards/rf-session.guard.ts:13`):
- Reads `x-rf-session-id` header -> `UnauthorizedException('Missing x-rf-session-id header')` if absent.
- Requires `req.tenantContext?.getTenantId()`.
- Calls `RfSessionService.validateSession` which SELECTs from `multitenant.db_rf_sessions` where `id = $1 AND tenant_id = $2 AND status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW())`.
- On success, bumps `last_activity_at = NOW()` and populates `req.rfSession = { sessionId, userId, facilityId, deviceId, workflowType, payload, state }`.

### 8.3 RF action authorization

`RfActionLightweightGuard` (`src/rf/guards/rf-action-lightweight.guard.ts:29`):
- Reads `@RfAction('read'|'create'|'update'|'delete')` metadata.
- Maps the session's `workflowType` to allowed actions via `WORKFLOW_ACTION_MAP`:
  - `RECEIVING, PUTAWAY, PICKING, PACKING, CYCLE_COUNT, TRANSFERS, QUALITY, REPLENISHMENT, LABOR, EQUIPMENT, VAS` -> `['read','create','update']`
  - `SHIPPING, MAINTENANCE` -> `['read','update']`
  - `ADMIN` -> all four (read/create/update/delete)
- Throws `ForbiddenException` if the action is not allowed for the session's workflow.

### 8.4 RF session data model (`prisma/schema.prisma:5287`)

```
model db_rf_sessions {
  id                String   @id @default(uuid()) @db.Uuid
  tenant_id         String   @db.Uuid
  facility_id       BigInt
  user_id           String   @db.Uuid
  device_id         String?
  workflow_type     String?  // PICKING, RECEIVING, PUTAWAY, PACKING, SHIPPING, CYCLE_COUNT, etc.
  session_token     String?
  payload_json      Json?
  state_json        Json?    // Persisted workflow state (e.g., pick state)
  pick_state_json   Json?
  status            String?  // ACTIVE, ENDED
  equipment_type    String?
  started_at        DateTime?
  last_activity_at  DateTime?
  expires_at        DateTime?
  ...
}
```

### 8.5 RF endpoint conventions

- **All RF routes are POST** (except `GET /rf/session/current`). Scanned barcodes and operator inputs are passed in the request body, not path/query params — typical for RF/scanner integrations.
- **Route pattern:** `POST /api/v1/wms/rf/{domain}/{action}`.
- **Authorization:** `RfSessionGuard` + `RfActionLightweightGuard` at the controller level. `@RfAction(...)` tags every endpoint. `@CheckAbility` is **not** applied to RF endpoints (beyond login) — granular CASL subject/action authorization is not enforced on RF handheld operations. This is a known limitation (see Appendix C).
- **Scanning/searching** = `@RfAction('read')`; **work assignment** (`nextTask`, `start`) = `@RfAction('update')`; **completing/confirming** = `@RfAction('update')`; **starting new work** = `@RfAction('create')`; **logout/check-out** = `@RfAction('delete')`.

### 8.6 RF endpoint catalog — by domain

The RF surface has **25 controllers** with **175 endpoints** across 13 domains. Full catalog:

#### Inbound — Purchase Orders (2 endpoints)
`POST /rf/purchase-orders/lookup` | `POST /rf/purchase-orders/start-receiving`

#### Inbound — Putaway (10 endpoints)
`POST /rf/inbound/putaway/next-task` | `/scan-lpn` | `/start` | `/assign` | `/scan-location` | `/suggest-location` | `/confirm` | `/my-tasks` | `/location-full` | `/report-damage`

#### Inbound — Receiving (13 endpoints)
`POST /rf/inbound/receive/assign-door` | `/start` | `/scan` | `/scan-asn` | `/scan-po` | `/scan-lpn` | `/blind-receive` | `/confirm` | `/stage` | `/complete` | `/damage-codes` | `/pending-approvals` | `/approve-variance`

#### Inbound — Returns (4 endpoints)
`POST /rf/inbound/returns/lookup-rma` | `/receive` | `/disposition` | `/complete`

#### Inbound — Trailers (3 endpoints)
`POST /rf/inbound/trailer/check-in` | `/assign-door` | `/depart`

#### Outbound — Packing (24 endpoints)
`POST /rf/outbound/pack/start` | `/scan-order` | `/scan-item` | `/pack` | `/seal` | `/close-carton` | `/complete` | `/my-session` | `/get-next` | `/nest-lpn` | `/report-shortage` | `/report-damage` | `/pending-exceptions` | `/:exceptionId/approve` | `/:exceptionId/reject` | `/verify-carton` | `/capture-weight` | `/confirm-weight` | `/print-packing-slip` | `/damage-codes` | `/validate-tote` | `/request-carton-override` | `/report-wrong-item` | `/request-tracking-number`

#### Outbound — Picking (27 endpoints)
`POST /rf/outbound/pick/next-task` | `/scan` | `/scan-location` | `/scan-product` | `/assign` | `/scan-tote` | `/confirm` | `/confirm-lpn` | `/short-pick` | `/my-tasks` | `/wave-status` | `/validate-inventory` | `/create-backorder` | `/setup-cluster` | `/cluster-next` | `/distribute` | `/cluster-complete` | `/batch-start` | `/bulk-confirm` | `/batch-complete` | `/scan-pallet` | `/confirm-pallet` | `/next-interleaved` | `/auto-unassign` | `/resume` | `/save-state` | `/set-equipment`

#### Outbound — Shipping (24 endpoints)
`POST /rf/outbound/shipping/start-load` | `/scan-trailer` | `/scan-lpn` | `/seal-trailer` | `/close-trailer` | `/get-next` | `/verify-shipment` | `/verify-load` | `/close-shipment` | `/capacity` | `/handoff` | `/bol` | `/manifest` | `/find-carton` | `/load-summary` | `/shipment-cartons` | `/scan-pallet` | `/current-stop` | `/next-stop` | `/validate-carton` | `/confirm-load` | `/force-close` | `/undo-load` | `/reassign-shipment`

#### Outbound — Staging (6 endpoints)
`POST /rf/outbound/staging/get-next` | `/scan-carton` | `/confirm-lane` | `/my-tasks` | `/undo-stage` | `/lane-contents`

#### Outbound — VAS Workstations (3 endpoints)
`POST /rf/vas/workstations` | `POST /rf/vas/workstations/:id/check-in` | `POST /rf/vas/workstations/:id/check-out`

#### Inventory — Holds & Transfer (4 endpoints)
`POST /rf/inventory/holds/place` | `POST /rf/inventory/holds/:id/release` | `POST /rf/inventory/holds/:lotId` | `POST /rf/inventory/transfer`

#### Inventory — LPN (2 endpoints)
`POST /rf/lpn/lookup` | `POST /rf/lpn/move`

#### Inventory — Cycle Count (16 endpoints)
`POST /rf/cycle-counts/start` | `/next-count-work` | `/scan-location` | `/scan-lpn` | `/start-lpn` | `/enter-qty` | `/submit-line` | `/save-draft` | `/complete` | `/pending-reviews` | `/:id/approve` | `/:id/reject` | `/:id/recount` | `/:id/root-cause` | `/create-ad-hoc` | `/:id/timeline`

#### Inventory — Replenishment (4 endpoints)
`POST /rf/replenishment/next` | `/scan-location` | `/scan-product` | `/confirm`

#### Quality — Inspection (11 endpoints)
`POST /rf/quality/inspections/lpn-lookup` | `/my-tasks` | `/:id/record-result` | `/get-next` | `/defect-codes` | `/validate-lot` | `/validate-expiry` | `/validate-temperature` | `/pending-review` | `/:id/supervisor-approve` | `/:id/supervisor-reject`

#### Warehouse — Facilities (1 endpoint)
`POST /rf/facilities/current`

#### Warehouse — Locations (1 endpoint)
`POST /rf/locations/lookup` — Warning: No guards applied (see Appendix C).

#### Master Data — Products (1 endpoint)
`POST /rf/products/lookup` — Warning: No guards applied (see Appendix C).

#### Equipment (3 endpoints)
`POST /rf/equipment/available` | `POST /rf/equipment/:id/check-out` | `POST /rf/equipment/:id/check-in`

#### Labor — Time Tracking (3 endpoints)
`POST /rf/labor/clock-in` | `/clock-out` | `/my-metrics`

#### Transfers (3 endpoints)
`POST /rf/transfers/initiate` | `/scan-lpn` | `/complete`

#### Work Orders (3 endpoints)
`POST /rf/work-orders/my-tasks` | `/:id/start-operation` | `/:id/complete-operation`

#### Dock Yard (1 endpoint)
`POST /rf/dock-appointments/upcoming`

#### Exceptions (1 endpoint)
`POST /rf/exceptions/report`

---

## 9. Web (Admin Console) Platform

The Web platform is the **management and configuration surface** for supervisors and administrators. It uses Bearer JWT auth + CASL `@CheckAbility` decorators.

### 9.1 Web endpoint conventions

- **Route pattern:** `POST|GET|PUT|PATCH|DELETE /api/v1/wms/web/{domain}/{action}`.
- **Authorization:** `JwtAuthGuard` (global) + `CaslGuard` (global) + `@CheckAbility({ action, subject })` on the controller method.
- **~430 endpoints** across **74 web controller classes** in **22 domains**.

### 9.2 Guarding status

- **CASL-guarded domains** (with `@CheckAbility`): inventory, quality, billing, equipment, labor, transfers, work-orders, dock-yard, exceptions, settings, workflow, integrations, reports, analytics, observability, fulfillment, security, and parts of outbound (allocation, pick-route, picking-task, replenishment, cross-dock, carrier-rates, VAS, staging) and inbound (receiving-approval, damage-codes, tolerance, trailers).
- **Unguarded domains** (no `@CheckAbility`, rely on global JWT only): most of master-data (UOM, vendors, categories, carriers, brands, customers, clients, products), most of warehouse (structure, facilities, zones, locations), and parts of inbound (ASN, PO, receiving, putaway, returns) and outbound (sales-orders, backorders, pick-audit, wave-tasks, picking-waves, loads, shipments, packing).

This guarding inconsistency is a known gap (see Appendix C).

### 9.3 Web controller summary (by domain)

| Domain | Controllers | ~Endpoints | Capability summary |
|---|---|---|---|
| Master Data | 16 | ~93 | CRUD for products, variants, barcodes, brands, categories, attributes, packaging, suppliers, client-assignments, velocity, imports, UOMs, clients, customers, vendors, carriers |
| Warehouse | 4 | ~35 | CRUD for facilities, zones, aisles, bays, rack-rows, levels, locations, loading-docks |
| Inbound | 11 | ~62 | CRUD for ASNs, POs, goods-receipts, putaway tasks/rules, damage codes, tolerances, approvals, trailers, returns |
| Outbound | 19 | ~127 | CRUD + operations for sales-orders, backorders, picking-tasks, pick-routes, pick-audit, waves, wave-tasks, replenishment rules/tasks, cross-dock, carrier-rates, loads, shipments, trailers, staging, packing, VAS catalog/execution |
| Inventory | 13 | ~61 | On-hand, lots, LPNs, transactions, holds, adjustments, allocations, approvals, ABC classification, cycle counts, supervisor reviews, root causes, count scheduler |
| Quality | 10 | ~43 | Inspections, holds, NCRs, receiving-inspections, dispositions, defect codes, inspection profiles, compliance requirements/audits, hazmat |
| Billing | 1 | 18 | Storage rates, client rates, billing cycles, snapshots, charges, invoices |
| Equipment | 2 | 12 | Equipment CRUD + status, maintenance CRUD + complete |
| Labor | 3 | 9 | Shifts CRUD, time logs list/delete, performance metrics list/delete |
| Transfers | 1 | 8 | Transfer CRUD + dispatch/receive/cancel |
| Work Orders | 1 | 13 | Work-order CRUD + release/complete/cancel, operations, components |
| Dock Yard | 1 | 14 | Dock appointments CRUD + check-in/complete/cancel, yard vehicles CRUD + assign-dock/depart |
| Exceptions | 2 | 14 | Exception CRUD + acknowledge/resolve + comments, escalation rules CRUD |
| Settings | 1 | 7 | System settings CRUD + defaults + history |
| Workflow | 4 | 20 | BPMN processes, state machines, rules, execution instances |
| Integrations | 1 | 8 | Webhooks, entity-mappings, sync-logs |
| Reports | 1 | 5 | Async report generation + list/get/download/delete |
| Analytics | 2 | 4 | Pick heatmap, daily KPIs |
| Observability | 2 | 6 | Warehouse events, audit logs |
| Fulfillment | 1 | 15 | Workflow definitions, executions, events, transitions, billing runs/events |
| Health | 1 | 1 | Health check (DB + Redis) — `@Public` |
| Security | 1 | 4 | Supervisor PIN create/verify/deactivate |

---

## 10. Domain: Warehouse & Facility Structure

### 10.1 Capability

The warehouse domain models the **physical warehouse hierarchy**:

```
Facility -> Zone -> Aisle -> Bay -> Rack Row -> Rack Level -> Storage Location
                                                                    |
                                                              Loading Dock
```

- **Facilities** (`warehouse_facilities`): The central hub, referenced by ~90 relations. Typed (WAREHOUSE, DISTRIBUTION_CENTER, COLD_STORAGE, HAZMAT_FACILITY, CROSS_DOCK, FULFILLMENT_CENTER, etc.). Each facility has a unique code per tenant.
- **Zones** (`warehouse_zones`): Typed (BULK, RACK, COLD_STORAGE, HAZMAT, PICKING, RECEIVING, SHIPPING, PACKING, QUALITY_HOLD, DAMAGE, TEMPORARY, YARD, RETURNS).
- **Storage Locations** (`storage_locations`): Typed (PALLET, CASE, EACH, SPECIALIZED, TEMPORARY, FORWARD_PICK, RESERVE). Have `barcode_value` (unique), `is_blocked`, `is_reserved`, `client_id` (for client-dedicated locations).
- **Loading Docks** (`loading_docks`): Typed (RECEIVING/SHIPPING). Have `is_available` flag.
- **Location Exceptions** (`location_exceptions`): Track locations that cannot be used (blocked, damaged, etc.).

### 10.2 RF capabilities

- `POST /rf/facilities/current` — Get current facility info for the RF session.
- `POST /rf/locations/lookup` — Scan location barcode to resolve a storage location. Warning: No RF session guard applied (see Appendix C).

### 10.3 Web capabilities

- **Facilities** (`web/facilities`): CRUD + hierarchy + summary (7 endpoints).
- **Zones** (`web/zones`): CRUD (5 endpoints).
- **Locations** (`web/locations`): CRUD + barcode lookup + capacity + available search (8 endpoints).
- **Structure** (`web`): Multi-entity CRUD for aisles, bays, rack-rows, levels, loading-docks (15 endpoints).

### 10.4 Manhattan WMS alignment

Manhattan models facilities -> zones -> locations -> dock doors. This platform preserves the hierarchy and adds dock appointments (see section 29) and yard management. The "Location Full" exception with automated alternate location suggestion (a Manhattan putaway feature) is implemented at `POST /rf/inbound/putaway/location-full`.

### 10.5 Key files

- `src/warehouse/facilities/` — `facility.service.ts`, RF + Web controllers
- `src/warehouse/locations/` — `location.service.ts`, RF + Web controllers
- `src/warehouse/zones/` — `zone.service.ts`, Web controller
- `src/warehouse/structure/` — `structure.service.ts`, Web controller (aisles, bays, racks, levels, docks)

---

## 11. Domain: Master Data

### 11.1 Capability

Master data encompasses all the **reference entities** that operational transactions depend on:

- **Products** (`products`): The central entity. Track serial numbers, lot numbers, expiry, hazardous flag, ABC analysis class. Has variants, barcodes, packaging hierarchy, suppliers, client assignments, velocity classification.
- **Product Variants** (`product_variants`): Size/color/style variants.
- **Product Barcodes** (`product_barcodes`): Multiple barcodes per product.
- **Product Brands** (`product_brands`), **Categories** (`product_categories`, tree structure), **Attributes** (`product_attributes`).
- **Product Packaging Hierarchy** (`product_packaging_hierarchy`): EACH -> CASE -> PALLET UOM conversions.
- **Product Suppliers** (`product_suppliers`): Vendor-product associations.
- **Product Client Assignments** (`product_client_assignments`): Which clients can order which products.
- **Product Velocity Classification** (`product_velocity_classification`): ABC class, velocity score, recommended zone/location type.
- **Product Import** (`product_import_jobs`, `product_import_results`): Async bulk product import via Excel/CSV.
- **Units of Measure** (`units_of_measure`): Referenced by ~25 models.
- **Clients** (`clients`): 3PL warehouse customers. Have credit limit, preferred carrier, addresses, contacts, facility assignments.
- **Customers** (`customers`): End customers (ship-to parties).
- **Vendors** (`vendors`): Suppliers. Have performance score, addresses, contacts.
- **Carriers** (`carriers`): Shipping carriers.
- **Barcode Labels** (`barcode_labels`): Label generation and print.
- **Hazmat Materials** (`hazmat_materials`): Hazardous material definitions.

### 11.2 RF capabilities

- `POST /rf/products/lookup` — Scan product barcode to resolve a product. Warning: No RF session guard applied (see Appendix C).

### 11.3 Web capabilities

16 web controllers providing full CRUD for all master-data entities listed above (~93 endpoints). Notable operational endpoints:
- `POST /web/products/import` — Create product import job (async).
- `GET /web/products/import/:id` — Get import job status.
- `POST /web/barcode-labels/generate` — Generate barcode label.
- `POST /web/barcode-labels/print` — Print barcode label.
- `POST /web/products/barcode-lookup` — Lookup product by barcode.

### 11.4 Manhattan WMS alignment

Manhattan's master data model (Item/ItemAlias/ItemPack/UOM/Customer/Vendor/Carrier) is mirrored. The ABC velocity classification maps to Manhattan's ABC analysis. Product packaging hierarchy maps to Manhattan's UOM conversion chain (EACH/CASE/PALLET).

### 11.5 Key files

- `src/master-data/products/` — `product.service.ts`, RF + Web controllers, `product-import.service.ts`
- `src/master-data/clients/` — `client.service.ts`, Web controller
- `src/master-data/vendors/` — `vendor.service.ts`, Web controller
- `src/master-data/uom/` — `uom.service.ts`, Web controller
- `src/master-data/barcode-labels/` — `barcode-label.service.ts`, Web controller

---

## 12. Domain: Inbound — Receiving

### 12.1 Capability

The receiving domain handles **inbound goods from suppliers**. The flow:

```
Trailer Check-In -> Dock Assignment -> ASN/PO Verification ->
Scan Item -> Enter Qty -> Over/Under Tolerance Check ->
Damage Handling -> Create LPN -> Stage -> Complete GRN ->
Generate Putaway Tasks
```

- **Advance Ship Notices (ASNs)** (`advance_ship_notices`, `asn_lines`): 8-state lifecycle (CREATED -> IN_TRANSIT -> ARRIVED -> IN_RECEIVING -> PARTIALLY_RECEIVED -> RECEIVED -> CLOSED -> CANCELLED). Async import via BullMQ (`asn-import.processor.ts`).
- **Purchase Orders** (`purchase_orders`, `purchase_order_lines`): Pre-receipt reference.
- **Goods Receipts** (`goods_receipts`, `goods_receipt_lines`, `goods_receipt_items`): 9-state lifecycle (CREATED -> ARRIVED -> RECEIVING -> PARTIAL -> RECEIVED -> INSPECTION_IN_PROGRESS -> INSPECTED -> COMPLETED -> CANCELLED). Track expected vs received vs damaged quantities, QC status, disposition action, variance type.
- **Receiving Tolerances** (`receiving_tolerance_configs`): Per product/vendor over/under tolerance, supervisor approval required flag.
- **Damage Codes** (`damage_codes`): Structured damage classification for receiving.
- **Receiving Approvals** (`receiving-approvals`): Supervisor approval/rejection of over/under variances.
- **Customer Returns** (`customer_returns`, `customer_return_items`): RMA-based returns with disposition. Receiving a return creates QC holds.

### 12.2 RF capabilities (13 endpoints)

- `POST /rf/inbound/receive/assign-door` — Scan dock door, assign appointment.
- `POST /rf/inbound/receive/start` — Start receiving by receiptId, ASN, or PO.
- `POST /rf/inbound/receive/scan` — Scan product barcode during receiving.
- `POST /rf/inbound/receive/scan-asn` / `/scan-po` — Load expected lines.
- `POST /rf/inbound/receive/scan-lpn` — Scan LPN/pallet to find staging location.
- `POST /rf/inbound/receive/blind-receive` — Receive without PO/ASN.
- `POST /rf/inbound/receive/confirm` — Confirm qty, damage, disposition.
- `POST /rf/inbound/receive/stage` — Set staging location.
- `POST /rf/inbound/receive/complete` — Close GRN, generate putaway tasks.
- `POST /rf/inbound/receive/damage-codes` — List active damage codes.
- `POST /rf/inbound/receive/pending-approvals` — List pending variance approvals.
- `POST /rf/inbound/receive/approve-variance` — Supervisor approve/reject.

**Trailer check-in (3 endpoints):** `POST /rf/inbound/trailer/check-in` | `/assign-door` | `/depart`

**Returns (4 endpoints):** `POST /rf/inbound/returns/lookup-rma` | `/receive` | `/disposition` | `/complete`

**Purchase Orders (2 endpoints):** `POST /rf/purchase-orders/lookup` | `/start-receiving`

### 12.3 Web capabilities

- **ASNs** (`web/advance-ship-notices`): CRUD + status/lines + import jobs (10 endpoints).
- **POs** (`web/purchase-orders`): CRUD + approve/lines/line-status (8 endpoints).
- **Goods Receipts** (`web/goods-receipts`): CRUD + receive-line/complete (6 endpoints).
- **Receiving Approvals** (`web/receiving-approvals`): Pending list + approve/reject (3 endpoints, CASL-guarded).
- **Damage Codes** (`web/damage-codes`): CRUD + seed defaults (6 endpoints, CASL-guarded).
- **Receiving Tolerances** (`web/receiving-tolerance`): Upsert/list/check (3 endpoints, CASL-guarded).
- **Putaway Tasks** (`web/putaway-tasks`): CRUD + assign/complete/suggest-location/by-grn (8 endpoints).
- **Putaway Rules** (`web/putaway-rules`): CRUD (5 endpoints).
- **Location Exceptions** (`web/location-exceptions`): Create/list/get (3 endpoints).
- **Inbound Trailers** (`web/inbound/trailers`): Check-in/assign-dock/list/get/depart (7 endpoints, CASL-guarded).
- **Returns** (`web/customer-returns`): CRUD + receive (6 endpoints).

### 12.4 Manhattan WMS alignment

**Manhattan process emulated:** `Trailer Check-In -> Dock Assignment -> ASN Verification -> Unload -> Scan Item -> Enter Qty -> Over/Under Tolerance Check -> Damage Handling -> Create LPN -> Stage -> Complete -> Putaway`

**Manhattan capabilities preserved:**
- 6-state ASN lifecycle
- Dock door validation (must be ACTIVE, AVAILABLE, support trailer type)
- Ownership/custody transfer (Supplier -> Warehouse)
- Pallet-level receiving (scan pallet barcode, confirm qty per pallet)
- LPN `QC_HOLD`/`DAMAGED` statuses
- Blind receiving (receive without ASN/PO)
- ASN variance sync + notify purchasing
- Over/under tolerance with supervisor approval

**Implementation status:** ~80% complete. Implemented: dock assignment, variance classification, blind receive, damage codes, tolerance configs, supervisor variance approval. Remaining gaps: proper trailer service with full check-in flow, returns RF workflow (stub), PO RF workflow (stub), proper staging step.

### 12.5 Key files

- `src/inbound/receiving/` — `receiving.service.ts`, `receiving-approval.service.ts`, `damage-code.service.ts`, `receiving-tolerance.service.ts`
- `src/inbound/asn/` — `asn.service.ts`, `asn-import.service.ts`, `asn-import.processor.ts`
- `src/inbound/purchase-orders/` — `purchase-order.service.ts`
- `src/inbound/putaway/` — `putaway.service.ts`, `putaway-rule.service.ts`
- `src/inbound/returns/` — `returns.service.ts`
- `src/inbound/trailers/` — `trailer.service.ts`

---

## 13. Domain: Inbound — Quality Inspection

### 13.1 Capability

Quality inspection handles **incoming goods quality control**:

```
Receiving Complete -> Inventory enters QC_HOLD ->
QC Task Created (Directed Work) -> Get Work ->
Scan LPN -> Load Inspection Checklist (Profile-based) ->
Record Findings/Defects -> Lot/Expiry/Temperature Validation ->
PASS / CONDITIONAL_PASS / FAIL -> Supervisor Review ->
LPN status update -> Audit trail
```

- **Quality Inspections** (`quality_inspections`): Reference type (GRN/ASN/LPN), inspection type/scope, result (NOT_REQUIRED/PENDING/PASSED/FAILED/CONDITIONAL_PASS), assigned inspector, start/completion timestamps.
- **Inspection Profiles** (`inspection_profiles`, `inspection_checklist_items`, `product_inspection_profiles`): Profile-based checklists per product type (pharma needs lot/expiry/temp; apparel needs color/size/stitching). Sampling method (FULL/STRATIFIED/RANDOM/RISK_BASED) and percentage.
- **Defect Codes** (`defect_codes`): Structured defect classification with category + severity.
- **Quality Holds** (`quality_holds`): 3-state (OPEN/RELEASED/CANCELLED) with hold reason, placed/released by user.
- **Non-Conformance Reports** (`non_conformance_reports`): NCRs with severity, corrective action required flag.
- **Inspection Events** (`quality_inspection_events`): Immutable audit trail of inspection result changes.
- **Receiving Inspections** (`receiving_inspection.controller.ts`): Create/list/get/delete receiving-specific inspections.
- **QC Dispositions** (`qc-dispositions`): Create/list/delete disposition decisions.

### 13.2 RF capabilities (11 endpoints)

- `POST /rf/quality/inspections/lpn-lookup` — Scan LPN to fetch QC info (Manhattan: QC Inspect LPN).
- `POST /rf/quality/inspections/my-tasks` — Get inspections assigned to current RF user.
- `POST /rf/quality/inspections/:id/record-result` — Record inspection result.
- `POST /rf/quality/inspections/get-next` — Directed work assignment (Get Work) [GAP-5].
- `POST /rf/quality/inspections/defect-codes` — List active defect codes [GAP-2].
- `POST /rf/quality/inspections/validate-lot` — Compare expected vs actual lot [GAP-4].
- `POST /rf/quality/inspections/validate-expiry` — Check expiry date against product thresholds [GAP-4].
- `POST /rf/quality/inspections/validate-temperature` — Record temperature reading [GAP-4].
- `POST /rf/quality/inspections/pending-review` — List inspections needing supervisor review [GAP-7].
- `POST /rf/quality/inspections/:id/supervisor-approve` — Supervisor approve [GAP-7].
- `POST /rf/quality/inspections/:id/supervisor-reject` — Supervisor reject, create reinspection [GAP-7].

### 13.3 Web capabilities (10 controllers)

Inspections (CRUD + supervisor approve/reject), holds (CRUD + release), NCRs (CRUD), receiving-inspections (CRUD), QC dispositions (CRUD), defect codes (CRUD + seed), inspection profiles (CRUD + assign-product + by-product), compliance requirements (CRUD), compliance audits (CRUD), hazmat materials (CRUD).

### 13.4 Manhattan WMS alignment

**Manhattan process emulated:** `Receiving Complete -> QC_HOLD -> Get Work -> Scan LPN -> Load Checklist -> Record Findings -> Validate Lot/Expiry/Temp -> PASS/CONDITIONAL_PASS/FAIL -> Supervisor Review -> LPN status update`

**Manhattan capabilities preserved:**
- Profile-based inspection checklists (per product type)
- Structured defect codes with category + severity (MINOR/MAJOR/CRITICAL)
- 3-way outcome (PASS/CONDITIONAL_PASS/FAIL)
- Statistical sampling (100%/STATISTICAL/FIXED_COUNT)
- Supervisor review for major defects
- Lot traceability, expiry minimums, cold-chain temperature logging

**Implementation status:** ~40% complete. Implemented: basic CRUD, lotId recording, defect codes, lot/expiry/temp validation, directed work (get-next), supervisor approve/reject. Remaining gaps: full inspection profile/checklist execution flow, statistical sampling enforcement, CONDITIONAL_PASS disposition logic.

### 13.5 Key files

- `src/quality/inspections/` — `inspection.service.ts`, `inspection-profile.service.ts`
- `src/quality/defects/` — `defect-code.service.ts`
- `src/quality/holds/` — `quality-hold.service.ts`
- `src/quality/ncr/` — `ncr.service.ts`
- `src/quality/compliance/` — `compliance.service.ts`
- `src/quality/receiving-inspection/` — `receiving-inspection.service.ts`

---

## 14. Domain: Inbound — Putaway

### 14.1 Capability

Putaway moves received goods to their storage locations:

```
Receiving Complete -> Putaway Task Created ->
Get Work -> Scan LPN -> Receive Destination (system-directed) ->
Travel -> Scan Destination -> Confirm Putaway ->
[Location Full -> Find Alternate] [Damage -> Reroute to QC] ->
LPN: STORED | Task: COMPLETED
```

- **Putaway Tasks** (`putaway_tasks`): Task with from/to location, product, lot, qty, UOM, assigned user, priority, LPN barcode. Uses legacy `task_status_old` enum (PENDING/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED/ON_HOLD).
- **Putaway Rules** (`putaway_rules`): Configurable putaway strategy rules.
- **Putaway Damage Records** (`putaway_damage_records`): Damage reported during putaway movement.
- **Location Exceptions** (`location_exceptions`): Track locations that are full/blocked.

### 14.2 RF capabilities (10 endpoints)

- `POST /rf/inbound/putaway/next-task` — Get next unassigned putaway task (directed work).
- `POST /rf/inbound/putaway/scan-lpn` — Lookup task by scanning LPN barcode.
- `POST /rf/inbound/putaway/start` — Start working on a task.
- `POST /rf/inbound/putaway/assign` — Assign task to a user.
- `POST /rf/inbound/putaway/scan-location` — Validate scanned location against directed putaway location.
- `POST /rf/inbound/putaway/suggest-location` — System-directed putaway location suggestion (weight-based).
- `POST /rf/inbound/putaway/confirm` — Confirm putaway placement.
- `POST /rf/inbound/putaway/my-tasks` — Get my assigned tasks.
- `POST /rf/inbound/putaway/location-full` — Flag location as full, get alternate.
- `POST /rf/inbound/putaway/report-damage` — Report damage during putaway movement.

### 14.3 Web capabilities

- **Putaway Tasks** (`web/putaway-tasks`): CRUD + assign/complete/suggest-location/by-grn (8 endpoints).
- **Putaway Rules** (`web/putaway-rules`): CRUD (5 endpoints).
- **Location Exceptions** (`web/location-exceptions`): Create/list/get (3 endpoints).

### 14.4 Manhattan WMS alignment

**Manhattan process emulated:** `Get Work -> Scan LPN -> System-Directed Destination -> Scan Destination -> Confirm -> [Location Full -> Alternate] [Damage -> QC]`

**Manhattan capabilities preserved:**
- System-directed putaway location suggestion (weight-based)
- "Location Full" exception with automated alternate location
- Damage-during-movement reroute to QC_HOLD
- Wrong-location override

**Implementation status:** ~75% complete. Implemented: 10 RF endpoints, suggestLocation (weight-based), location-full exception, damage reporting. Remaining gaps: capacity/volume validation + hazmat class segregation + customer-ownership commingling prohibition, overflow location strategy (primary vs overflow tiers), task interleaving (cross-workflow by proximity).

### 14.5 Key files

- `src/inbound/putaway/` — `putaway.service.ts`, `putaway-rule.service.ts`

---

## 15. Domain: Inventory

### 15.1 Capability

The inventory domain is the **core stock management layer**:

- **Inventory On-Hand** (`inventory_on_hand`): Current stock per `(facility, product, location, lot)`. Tracks `quantity_on_hand`, `quantity_allocated`, `quantity_reserved`, `quantity_picked`, `quantity_on_hold`, `quantity_damaged`. Owner client tracking for 3PL.
- **Inventory Items** (`inventory_items`): Item-level detail with serial number, LPN, status, hold reason, damaged flag.
- **Inventory Lots** (`inventory_lots`): Lot tracking with expiry date, received/remaining quantity, status, hold reason.
- **Inventory Transactions** (`inventory_transactions`): Immutable transaction log. 20 transaction types (RECEIPT, ISSUE, ADJUSTMENT, TRANSFER, RETURN, PHYSICAL_COUNT, CYCLE_COUNT, SPOT_CHECK, WRITE_OFF, RESERVATION, ALLOCATION, DEALLOCATION, PICK, PUTAWAY, ADJUSTMENT_INCREASE, ADJUSTMENT_DECREASE, TRANSFER_IN, TRANSFER_OUT, QUARANTINE, SCRAP). 5 statuses (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ERROR). Tracks `quantity_before` and `quantity_after`.
- **Inventory Adjustments** (`inventory_adjustments`, `inventory_adjustment_lines`): Stock adjustments with 10 reasons (DAMAGED, EXPIRED, LOST, STOLEN, ADMIN_ERROR, SYSTEM_ERROR, QUALITY_ISSUE, SAMPLE, PROMOTION, OTHER). Approval workflow.
- **Inventory Allocations** (`inventory_allocations`, `inventory_allocation_rules`, `inventory_allocation_rule_constraints`, `inventory_allocation_rule_locations`): Reserve stock for orders. Configurable allocation rules with constraints and location preferences.
- **Inventory Reservations** (`inventory_reservations`): Soft reservations.
- **Inventory Holds** (`inventory_holds`): 4-state (ACTIVE/RELEASED/EXPIRED/SUPERSEDED) with 12 hold reasons (QC_PENDING, QC_FAILED, DAMAGE, EXPIRY, CREDIT_HOLD, CYCLE_COUNT, INVESTIGATION, COMPLIANCE, CUSTOMER_REQUEST, VENDOR_RETURN, RECALL, QUARANTINE).
- **Inventory Policies** (`inventory_policies`): Configurable inventory policies.
- **License Plate Numbers (LPNs)** (`license_plate_numbers`): 16-state lifecycle (RECEIVED -> IN_STAGING -> IN_QC -> PUTAWAY_PENDING -> IN_TRANSIT -> STORED -> ALLOCATED -> PICK_PENDING -> PICKED -> PACKED -> NESTED -> STAGED -> LOADED -> SHIPPED -> QUARANTINED -> CONSUMED -> DISPOSED). 7 LPN types (PALLET, CARTON, CASE, EACH, MIXED, TOTE, BIN). Support nesting (parent_lpn_id).
- **LPN Transactions** (`lpn_transactions`): 11 transaction types (CREATED, RECEIVED, MOVED, NESTED, UNNESTED, PICKED, PACKED, SHIPPED, STATUS_CHANGE, MERGED, SPLIT, DISPOSED).
- **Replenishment** (`replenishment_rules`, `replenishment_tasks`): Forward-pick replenishment (see section 17).
- **Location Pick Heatmap** (`location_pick_heatmap`): Pick density analytics per location.

### 15.2 RF capabilities

**Inventory holds & transfer (4 endpoints):**
- `POST /rf/inventory/holds/place` — Place inventory hold.
- `POST /rf/inventory/holds/:id/release` — Release inventory hold.
- `POST /rf/inventory/holds/:lotId` — Check holds for a lot.
- `POST /rf/inventory/transfer` — Transfer inventory between locations.

**LPN (2 endpoints):**
- `POST /rf/lpn/lookup` — Lookup LPN by barcode.
- `POST /rf/lpn/move` — Move LPN to new location.

### 15.3 Web capabilities (13 controllers)

- **On-Hand** (`web/inventory`): List/get + aging report + aging summary + delete (5 endpoints).
- **Lots** (`web/inventory-lots`): CRUD (5 endpoints).
- **LPNs** (`web/lpns`): CRUD + barcode lookup + transactions (7 endpoints).
- **Transactions** (`web/inventory-transactions`): List/get/execute/delete (4 endpoints).
- **Adjustments** (`web/inventory-adjustments`): Create/list/get/approve/delete (5 endpoints).
- **Allocations** (`web` allocation routes): Create/list + allocation rules CRUD + delete (6 endpoints).
- **Approvals** (`web/approvals`): Pending list + approve/reject + thresholds (6 endpoints).
- **Holds** (`web/inventory-holds`): CRUD + release (6 endpoints).
- **ABC Classification** (`web/inventory/abc-classification`): List/update/delete (3 endpoints).

### 15.4 Manhattan WMS alignment

Manhattan's inventory model (LPN, lot, on-hand, allocation, hold, transaction) is mirrored directly. The LPN 16-state lifecycle matches Manhattan's LPN status flow. The transaction type enum covers Manhattan's receipt/issue/adjustment/transfer/return/count/reservation/allocation/pick/putaway/quarantine/scrap operations.

### 15.5 Key files

- `src/inventory/on-hand/` — `on-hand.service.ts`
- `src/inventory/lots/` — `lot.service.ts`
- `src/inventory/lpn/` — `lpn.service.ts`
- `src/inventory/transactions/` — `transaction.service.ts`
- `src/inventory/adjustments/` — `adjustment.service.ts`, `adjustment-approval.service.ts`, `approval-threshold.service.ts`
- `src/inventory/allocations/` — `allocation.service.ts`
- `src/inventory/holds/` — `hold.service.ts`

---

## 16. Domain: Inventory — Cycle Count

### 16.1 Capability

Cycle counting is the **inventory accuracy verification process**:

```
Generate Count Task (ABC scheduled) -> Get Count Work ->
Travel to Location -> Scan Location -> Blind Count ->
Enter Quantity -> Submit Count -> Variance Detection ->
[<= threshold -> Auto-Approve] [> threshold -> Recount (different operator)] ->
[approved -> Inventory Adjustment] -> Supervisor Review ->
Root Cause Analysis -> Audit Trail
```

- **Inventory Counts** (`inventory_counts`): Count scope, method (CYCLE/PHYSICAL/SPOT/BLIND/CONTROL_GROUP/OPPORTUNITY), frequency (MANUAL/DAILY/WEEKLY/MONTHLY/QUARTERLY/ABC_DRIVEN), priority, blind count flag, parent count (for recounts), accuracy percentage.
- **Inventory Count Lines** (`inventory_count_lines`): Per product/lot/location: counted qty, system qty, variance qty, status (PENDING_REVIEW...), counted by, approved by, count round, repeat variance flag.
- **Count Accuracy History** (`count_accuracy_history`): Historical accuracy per product/ABC class.
- **Cycle Count Metrics** (`cycle_count_metrics`): Period accuracy, total variance, A-class accuracy, adjustments requiring approval, items counted per hour.
- **Count Scheduler Metrics** (`count_scheduler_metrics`): Scheduler performance.
- **Variance Investigations** (`variance_investigations`): 6-state (OPEN/ASSIGNED/IN_PROGRESS/PENDING_APPROVAL/RESOLVED/CLOSED) with variance reason (COUNT_ERROR/SYSTEM_ERROR/PHYSICAL_DAMAGE/THEFT/RECEIVING_ERROR/PICKING_ERROR/PUTAWAY_ERROR/TRANSACTION_ERROR/LOCATION_ERROR/PRODUCT_MIX/UNIT_OF_MEASURE_ERROR/EXPIRATION/QUALITY_HOLD/OTHER).
- **Adjustment Approval Requests** (`adjustment_approval_requests`): 5-state approval workflow (PENDING/APPROVED/REJECTED/ESCALATED/CANCELLED) with 5 approval levels (AUTO_APPROVED/SUPERVISOR/MANAGER/DIRECTOR/EXECUTIVE).
- **ABC Reclassification Log** (`abc_reclassification_log`): Tracks ABC class changes.
- **Approval Threshold Configs** (`approval_threshold_configs`): Auto-approve %, supervisor review %, recount %.

### 16.2 RF capabilities (16 endpoints)

- `POST /rf/cycle-counts/start` — Start cycle count.
- `POST /rf/cycle-counts/next-count-work` — Get next count work (collision-safe assignment).
- `POST /rf/cycle-counts/scan-location` — Scan location with validation.
- `POST /rf/cycle-counts/scan-lpn` — Scan LPN to verify item at location.
- `POST /rf/cycle-counts/start-lpn` — Start LPN counting mode.
- `POST /rf/cycle-counts/enter-qty` — Enter counted quantity.
- `POST /rf/cycle-counts/submit-line` — Submit count line.
- `POST /rf/cycle-counts/save-draft` — Save draft count line.
- `POST /rf/cycle-counts/complete` — Complete cycle count.
- `POST /rf/cycle-counts/pending-reviews` — List counts pending supervisor review.
- `POST /rf/cycle-counts/:id/approve` — Approve count variance.
- `POST /rf/cycle-counts/:id/reject` — Reject count variance.
- `POST /rf/cycle-counts/:id/recount` — Request recount.
- `POST /rf/cycle-counts/:id/root-cause` — Assign root cause to variance.
- `POST /rf/cycle-counts/create-ad-hoc` — Create ad-hoc count from RF.
- `POST /rf/cycle-counts/:id/timeline` — Get count audit timeline.

### 16.3 Web capabilities

- **Cycle Counts** (`web/cycle-counts`): CRUD + submit-line/complete (7 endpoints).
- **Cycle Count Supervisor** (`web/cycle-counts` supervisor sub-routes): Pending-reviews, approve/reject/recount, compare-recount, timeline, next-count-work, create-ad-hoc, save-draft-line, progress (9 endpoints).
- **Root Cause Categories** (`web/root-cause-categories`): Create/list + assign (3 endpoints).
- **Count Scheduler** (`web/count-scheduler`): Generate scheduled counts + reclassify-ABC + metrics (3 endpoints).

### 16.4 Manhattan WMS alignment

**Manhattan process emulated:** `Get Count Work -> Scan Location -> Blind Count -> Enter Qty -> Submit -> Variance -> Auto-Approve / Recount -> Supervisor Review -> Root Cause -> Audit Trail`

**Manhattan capabilities preserved:**
- Auto-approval of small variances (no human intervention) via threshold configs
- Inventory adjustment on approval (updates `inventory_on_hand`)
- Recount generation with **segregation of duties** (different operator)
- Supervisor review (approve/reject/request-recount/launch-investigation)
- Root-cause categorization (Receiving Error/Picking Error/Damage/Theft/Misplaced/System Error)
- ABC-class scheduling (A=weekly, B=monthly, C=quarterly)
- LPN counting mode (scan LPN, verify contents)
- Blind count

**Implementation status:** ~55% complete. Implemented: 16 RF endpoints, count creation, location scanning, qty entry, variance detection, supervisor approve/reject/recount, root-cause assignment, LPN count mode, ad-hoc counts, auto-approval via BullMQ processor, ABC reclassification. Remaining gaps: full inventory adjustment on approval (currently creates investigation but on-hand update is partial), ABC scheduling engine completeness.

### 16.5 Key files

- `src/inventory/counts/` — `cycle-count.service.ts`, `cycle-count-threshold.service.ts`, `count-scheduler.service.ts`, `root-cause.service.ts`
- `src/inventory/approvals/` — `adjustment-approval.service.ts`, `approval-threshold.service.ts`, `auto-approval.processor.ts`

---

## 17. Domain: Inventory — Replenishment

### 17.1 Capability

Replenishment moves stock from **reserve storage to forward-pick locations** to maintain pick availability:

- **Replenishment Rules** (`replenishment_rules`): Trigger conditions, source/target locations, min/max quantities.
- **Replenishment Tasks** (`replenishment_tasks`): Task with from/to location, product, qty, status (legacy `task_status_old` enum).

### 17.2 RF capabilities (4 endpoints)

- `POST /rf/replenishment/next` — Get next replenishment task.
- `POST /rf/replenishment/scan-location` — Scan source location.
- `POST /rf/replenishment/scan-product` — Scan product.
- `POST /rf/replenishment/confirm` — Confirm replenishment task.

### 17.3 Web capabilities

- **Replenishment Rules** (`web/replenishment-rules`): CRUD (5 endpoints).
- **Replenishment Tasks** (`web/replenishment-tasks`): List/get/update/delete (4 endpoints).

### 17.4 Manhattan WMS alignment

Manhattan's replenishment model (min/max trigger, reserve-to-forward move) is mirrored. Task interleaving with putaway (a Manhattan feature to reduce empty travel) is a known gap.

### 17.5 Key files

- `src/inventory/replenishment/` — `replenishment.service.ts` (RF controller + Web controller share the service)

---

## 18. Domain: Outbound — Sales Orders & Allocation

### 18.1 Capability

The outbound flow begins with **sales orders and inventory allocation**:

- **Sales Orders** (`sales_orders`): 12-state lifecycle (CREATED -> VALIDATED -> ON_HOLD -> RELEASED -> WAVED -> ALLOCATED -> PICKED -> PACKED -> READY_TO_SHIP -> SHIPPED -> CLOSED -> CANCELLED). 7 order types (STANDARD, EXPEDITED, BACKORDER, DROP_SHIP, TRANSFER, REPLACEMENT, RETURN). Linked to client, customer, sales rep.
- **Sales Order Lines** (`sales_order_lines`): 12-state lifecycle (CREATED -> ON_HOLD -> ALLOCATED -> RELEASED -> PICK_IN_PROGRESS -> PICKED -> SHORT -> PACKED -> READY_TO_SHIP -> SHIPPED -> BACKORDERED -> CANCELLED). Track requested/fulfilled/remaining quantity.
- **Backorder Records** (`backorder_records`): Track open backorders for shortfall handling.
- **Inventory Allocation** (`inventory_allocations`): Reserve stock for order lines. Allocation rules with constraints (product, location, client) and location preferences.
- **Cross-Dock Operations** (`cross_dock_operations`): Cross-docking for inbound-to-outbound direct flow.

### 18.2 RF capabilities

No direct RF endpoints for sales orders. Allocation is handled via the allocation controller (operational).

### 18.3 Web capabilities

- **Sales Orders** (`web/sales-orders`): CRUD + status transition/lines add+get/recalculate/validate (10 endpoints).
- **Backorders** (`web/backorders`): List open backorders (1 endpoint).
- **Allocation** (`web` allocation routes): allocate-line/allocate-order/deallocate/check-availability/by-order (5 endpoints, CASL-guarded).
- **Cross-Dock** (`web/cross-dock-operations`): CRUD (5 endpoints, CASL-guarded).

### 18.4 Manhattan WMS alignment

Manhattan's order lifecycle (CREATED -> ALLOCATED -> WAVED -> PICKED -> PACKED -> SHIPPED) is mirrored. Allocation rules with constraints map to Manhattan's allocation strategy. Cross-dock operations map to Manhattan's cross-dock flow.

### 18.5 Key files

- `src/outbound/sales-orders/` — `sales-order.service.ts`
- `src/outbound/allocation/` — `allocation.service.ts`
- `src/outbound/cross-dock/` — `cross-dock.service.ts`

---

## 19. Domain: Outbound — Picking & Waves

### 19.1 Capability

Picking is the **core outbound execution process**:

```
Wave Created -> Allocation (reserve inventory) -> Generate Pick Tasks ->
[Pick-to-Tote | Cluster | Batch | Case | Full Pallet] ->
Get Work -> Scan Tote(s) -> Travel (route-optimized) ->
Scan Location -> Pick -> [Cluster: distribute to totes] ->
Confirm -> Short Pick? -> Next Location -> Wave Completion Check ->
Inventory to Packing
```

- **Picking Waves** (`picking_waves`, `wave_orders`): Wave-level grouping of orders. Track total/completed tasks.
- **Picking Tasks** (`picking_tasks`): 8-state lifecycle (CREATED -> AVAILABLE -> ASSIGNED -> IN_PROGRESS -> ON_HOLD -> COMPLETED -> EXCEPTION -> CANCELLED). Track quantity_to_pick/picked, from/to location, product, lot, LPN, cluster group, wave.
- **Pick Carts** (`pick_carts`, `pick_cart_assignments`): Cart-based cluster picking.
- **Pick Routes** (`pick_routes`): Route-optimized pick sequences (nearest-neighbor by aisle/bay/level).
- **Pick Batch Sessions** (`pick_batch_sessions`): Batch picking groups tasks by SKU.
- **Cluster Pick Groups** (`cluster_pick_groups`): Cluster picking with cart + totes.
- **Batch Sortation Sessions** (`batch_sortation_sessions`): Sortation after batch pick.
- **Pick Audit Log** (`pick_audit_log`): Immutable audit trail.
- **Short Pick Reasons** (`short_pick_reasons`): Structured short-pick reason codes.

### 19.2 RF capabilities (27 endpoints)

**Core picking:**
- `POST /rf/outbound/pick/next-task` — Get next available pick task (with equipment/route optimization).
- `POST /rf/outbound/pick/scan` — Scan barcode to find pick task.
- `POST /rf/outbound/pick/scan-location` — Verify pick location by scanning location barcode.
- `POST /rf/outbound/pick/scan-product` — Verify product by scanning product barcode.
- `POST /rf/outbound/pick/assign` — Assign pick task to user.
- `POST /rf/outbound/pick/scan-tote` — Scan destination tote/carton barcode.
- `POST /rf/outbound/pick/confirm` — Confirm pick — record picked qty, update inventory.
- `POST /rf/outbound/pick/confirm-lpn` — Confirm pick by scanning LPN barcode.
- `POST /rf/outbound/pick/short-pick` — Short pick — pick partial qty with reason.
- `POST /rf/outbound/pick/my-tasks` — Get my active pick tasks.
- `POST /rf/outbound/pick/wave-status` — View current wave progress.
- `POST /rf/outbound/pick/validate-inventory` — Pre-pick inventory validation check.
- `POST /rf/outbound/pick/create-backorder` — Create backorder for shortfall.

**Cluster picking:**
- `POST /rf/outbound/pick/setup-cluster` — Setup cluster pick with cart + totes.
- `POST /rf/outbound/pick/cluster-next` — Next task for cluster session.
- `POST /rf/outbound/pick/distribute` — Distribute pick to multiple totes.
- `POST /rf/outbound/pick/cluster-complete` — Complete cluster session.

**Batch picking:**
- `POST /rf/outbound/pick/batch-start` — Start batch pick session (groups tasks by SKU).
- `POST /rf/outbound/pick/bulk-confirm` — Confirm bulk pick (batch).
- `POST /rf/outbound/pick/batch-complete` — Complete batch phase, trigger sortation.

**Pallet picking:**
- `POST /rf/outbound/pick/scan-pallet` — Scan pallet LPN for full pallet pick.
- `POST /rf/outbound/pick/confirm-pallet` — Confirm full pallet pick.

**Interleaving & session:**
- `POST /rf/outbound/pick/next-interleaved` — Get nearest interleavable pick task to a location.
- `POST /rf/outbound/pick/auto-unassign` — Auto-unassign expired/abandoned pick tasks (admin).
- `POST /rf/outbound/pick/resume` — Resume pick session from last known state.
- `POST /rf/outbound/pick/save-state` — Save current pick state to session.
- `POST /rf/outbound/pick/set-equipment` — Set operator equipment type on RF session.

### 19.3 Web capabilities

- **Picking Tasks** (`web/picking-tasks`): List/get/assign/complete/cancel/delete (6 endpoints, CASL-guarded).
- **Pick Routes** (`web/pick-routes`): View optimized pick route + re-optimize (2 endpoints, CASL-guarded).
- **Pick Audit** (`web/audit/pick`): Pick audit timeline for a task (1 endpoint).
- **Picking Waves** (`web/picking-waves`): CRUD + release/complete/orders (7 endpoints).
- **Wave Tasks** (`web/wave-tasks`): Get all tasks in a wave (1 endpoint).

### 19.4 Manhattan WMS alignment

**Manhattan process emulated:** `Wave Created -> Allocation -> Generate Pick Tasks -> [Pick-to-Tote | Cluster | Batch | Case | Full Pallet] -> Get Work -> Scan Tote -> Travel -> Scan Location -> Pick -> Confirm -> Short Pick? -> Wave Completion -> Packing`

**Manhattan capabilities preserved:**
- **Cluster picking** (one visit, pick total qty, distribute across multiple totes on a cart with shelves)
- **Batch picking** (bulk gather, sort later at sortation station)
- **Case picking** (UOM hierarchy: EACH/CASE/PALLET via `eaches_per_case`/`cases_per_pallet`)
- **Wave-level operations** (wave status, completion checks)
- **Route optimization** (nearest-neighbor sequencing by aisle/bay/level to minimize travel)
- **Task interleaving** (cross-workflow: Picking/Replenishment/Cycle Count/Transfer by proximity)
- **Allocation validation before pick** (compare reserved vs physical on-hand -> flag AT_RISK -> trigger replenishment)
- **Short pick** with reason codes
- **Full pallet pick** shortcut
- **Session resume** (save/resume pick state)

**Implementation status:** ~65% complete. Implemented: 27 RF endpoints, pick-to-tote, cluster picking, batch picking, case/pallet pick, route optimization, task interleaving, pre-pick validation, short pick, backorder creation, session resume. Remaining gaps: full wave-completion-check enforcement, sortation station execution completeness.

### 19.5 Key files

- `src/outbound/picking-tasks/` — `picking-task.service.ts`, `cluster-pick.service.ts`, `pick-route.service.ts`
- `src/outbound/picking-waves/` — `picking-wave.service.ts`

---

## 20. Domain: Outbound — Packing

### 20.1 Capability

Packing transforms picked items into shippable cartons:

```
Assign Station -> Get Pack Work -> Scan Pick LPN (Tote) ->
Assign Carton -> Nest Pick LPN into Carton -> Verify Contents ->
Weight Capture (Scale) -> Carton Close -> Generate Shipping Label ->
Generate Packing Slip ->
[Multi-Carton: Cartonization] [Shortage: Short Pack Exception]
[Damage: Hold + Replace Pick] [Supervisor Override] ->
All Cartons Packed -> Shipment Ready
```

- **Packing Sessions** (`packing_sessions`): 6-state lifecycle (STATION_ASSIGNED -> PACKING_ACTIVE -> PACKING_PAUSED -> PACKING_COMPLETED -> PACKING_CANCELLED -> STATION_TIMEOUT). Track user, station, current order, orders/cartons completed, planned_cartons, completed_cartons, exceptions_count.
- **Packing Slips** (`packing_slips`, `packing_slip_items`): DRAFT status, packed by user, weight, volume.
- **Packing Containers** (`packing_containers`): Track carton_index/total_cartons ("1 of 3", "2 of 3"), staging lane assignment, shipment link.
- **Packing Stations** (`packing_stations`): Station lifecycle (AVAILABLE -> ASSIGNED -> ACTIVE -> RELEASED). Linked to scale device.
- **Packing Materials** (`packing_materials`): Carton types, void fill, tape.
- **Packing Carton Plan** (`packing_carton_plan`): Cartonization plan entries (which items go in which carton).
- **Packing Exceptions** (`packing_exceptions`): Short pack, damage, wrong item, carton override.
- **Packing Damage Codes** (`packing_damage_codes`): Structured damage classification for packing.
- **Cartonization Rules** (`cartonization_rules`): Priority, conditions JSON, carton type.
- **Customer Cartonization Preferences** (`customer_cartonization_preferences`): Per-customer carton type preferences.
- **Scale Device Config** (`scale_device_config`): Scale integration configuration.
- **VAS Workstations** (`vas_workstations`): Value-added service workstations.

### 20.2 RF capabilities (24 endpoints)

- `POST /rf/outbound/pack/start` — Start packing session at station.
- `POST /rf/outbound/pack/scan-order` — Scan order barcode to assign to session.
- `POST /rf/outbound/pack/scan-item` — Scan product barcode to verify packed item.
- `POST /rf/outbound/pack/pack` — Pack scanned items into container.
- `POST /rf/outbound/pack/seal` — Seal container with seal number.
- `POST /rf/outbound/pack/close-carton` — Close carton — generate shipping LPN, print label data. Enforces nested-LPN check (no open child LPNs).
- `POST /rf/outbound/pack/complete` — Complete packing session.
- `POST /rf/outbound/pack/my-session` — Get current packing session for user.
- `POST /rf/outbound/pack/get-next` — Get next packing work (directed assignment). Runs cartonization automatically the first time an operator gets pack work for an order.
- `POST /rf/outbound/pack/nest-lpn` — Nest pick LPN into carton LPN.
- `POST /rf/outbound/pack/report-shortage` — Report shortage during packing.
- `POST /rf/outbound/pack/report-damage` — Report damage during packing.
- `POST /rf/outbound/pack/pending-exceptions` — List pending supervisor exceptions.
- `POST /rf/outbound/pack/:exceptionId/approve` — Supervisor approve exception.
- `POST /rf/outbound/pack/:exceptionId/reject` — Supervisor reject exception.
- `POST /rf/outbound/pack/verify-carton` — Verify carton contents before close (expected vs actual per carton, missing/extra detection).
- `POST /rf/outbound/pack/capture-weight` — Capture weight from scale (delegates to `ScaleIntegrationService` -> `DummyScaleProvider`).
- `POST /rf/outbound/pack/confirm-weight` — Confirm weight reading (tolerance validation).
- `POST /rf/outbound/pack/print-packing-slip` — Print packing slip for current carton.
- `POST /rf/outbound/pack/damage-codes` — List packing damage codes.
- `POST /rf/outbound/pack/validate-tote` — Validate tote LPN is assigned to session.
- `POST /rf/outbound/pack/request-carton-override` — Request alternate carton type.
- `POST /rf/outbound/pack/report-wrong-item` — Report wrong item during packing (increments error counter on picking task's notes).
- `POST /rf/outbound/pack/request-tracking-number` — Request tracking number from carrier API (stub: deterministic tracking based on shipment number + timestamp).

### 20.3 Web capabilities

- **Packing Sessions** (`web/packing`): Lifecycle (start/get/assign-order/pack/complete/delete/list) + containers seal + stations + exceptions approve/reject + packing-slips + cartonize + cartonization-rules CRUD + shipment packing-status + picking-quality report (18 endpoints).

### 20.4 Manhattan WMS alignment

**Manhattan process emulated:** `Assign Station -> Get Pack Work -> Scan Pick LPN -> Assign Carton -> Nest LPN -> Verify Contents -> Weight Capture -> Carton Close -> Generate Label -> Generate Packing Slip -> [Cartonization] [Short Pack] [Damage] [Supervisor Override] -> Shipment Ready`

**Manhattan capabilities preserved:**
- **Directed pack work** ("Get Pack Work" push-assignment)
- **Cartonization engine** (system determines # cartons, carton type, item distribution from dimensions/weight/hazmat/carrier rules -> "1 of 3, 2 of 3" tracking)
- **Carton content verification** (expected vs actual per carton, missing/extra detection)
- **Weight capture via scale integration** (Mettler Toledo etc., weight tolerance validation, carrier billing accuracy)
- **Short pack / partial packing** with supervisor exception
- **Damage during packing** (hold + damage record + replacement pick request)
- **Supervisor override** (qty variance, alternate carton, shipment release)
- **Packing slip generation**
- **Order lifecycle** `PICKING -> PACKING -> READY_FOR_SHIPMENT -> SHIPPED`
- **Pack station lifecycle** `AVAILABLE -> ASSIGNED -> ACTIVE -> RELEASED`
- **Customer cartonization preferences** (per-customer carton type)
- **Carrier tracking number** request (stub implementation)

**Implementation status:** ~85% complete (recently gap-filled). Implemented: 24 RF endpoints, directed pack work, cartonization engine with rules + customer preferences, content verification, scale integration (DummyScaleProvider), short-pack/damage/wrong-item exceptions, supervisor approve/reject, packing slips, nested-LPN enforcement on close-carton, cartonization-rules CRUD, picking-quality report. Remaining gaps: real carrier API integration (currently stub), real scale hardware provider (currently DummyScaleProvider).

### 20.5 Key files

- `src/outbound/packing/` — `packing.service.ts`, `cartonization.service.ts`, `scale-integration.service.ts`
- `src/outbound/packing/rf/packing.controller.ts` — RF controller (24 endpoints)
- `src/outbound/packing/web/packing.controller.ts` — Web controller (18 endpoints)

---

## 21. Domain: Outbound — Staging

### 21.1 Capability

Staging moves packed cartons to **carrier/route-specific staging lanes** before loading:

```
Packing Complete -> Get Staging Work -> Scan Carton ->
Move to Staging Lane -> Scan Staging Location ->
Carton: PACKED -> STAGED
```

- **Staging Lanes** (`staging_lanes`): Typed (CARRIER/ROUTE/DOOR/WAVE). Have max_cartons, current_carton_count, assigned carrier/door/route.
- **Staging Work Queue** (`staging_work_queue`): Track staging tasks (PENDING_STAGE -> STAGED). Priority, assigned to, staged_at.

### 21.2 RF capabilities (6 endpoints)

- `POST /rf/outbound/staging/get-next` — Get next staging task for operator.
- `POST /rf/outbound/staging/scan-carton` — Scan carton barcode for staging validation.
- `POST /rf/outbound/staging/confirm-lane` — Confirm staging lane after scan.
- `POST /rf/outbound/staging/my-tasks` — List staging tasks for current operator.
- `POST /rf/outbound/staging/undo-stage` — Reverse staging (STAGED -> PACKED).
- `POST /rf/outbound/staging/lane-contents` — Get cartons staged at a lane.

### 21.3 Web capabilities

- **Staging Lanes** (`web/staging`): List/create staging lanes + lane contents (3 endpoints, CASL-guarded).

### 21.4 Manhattan WMS alignment

**Manhattan process emulated:** `Packing Complete -> Get Staging Work -> Scan Carton -> Move to Staging Lane -> Scan Staging Location -> Carton: PACKED -> STAGED`

**Manhattan capabilities preserved:**
- Dedicated staging workflow (staging lanes typed CARRIER/ROUTE/DOOR/WAVE)
- Directed staging work ("Get Staging Work" by priority)
- Staging lane validation
- Undo staging (reverse STAGED -> PACKED)
- Lane contents query

**Implementation status:** ~90% complete. Implemented: 6 RF endpoints, get-next directed work, scan-carton validation, confirm-lane, my-tasks, undo-stage, lane-contents. Remaining gaps: staging lane auto-assignment optimization.

### 21.5 Key files

- `src/outbound/staging/` — `staging.service.ts`

---

## 22. Domain: Outbound — Shipping

### 22.1 Capability

Shipping loads staged cartons onto trailers and manages **carrier handoff**:

```
Phase A — Staging: (see section 21)
Phase B — Load Management: Create Load -> Scan Load -> Assign Trailer ->
         Load: CREATED -> PLANNED -> ASSIGNED
Phase C — RF Trailer Loading: Get Loading Work -> Scan Trailer ->
         Scan Carton -> Physical Load -> Confirm Loaded ->
         Scan Next... -> Shipment Verification (all cartons present?) ->
         Close Shipment -> Close Load -> Manifest -> Carrier Handoff
```

- **Outbound Shipments** (`outbound_shipments`): 7-state lifecycle (CREATED -> CARRIER_ASSIGNED -> STAGED -> LOADED -> SHIPPED -> DELIVERED -> CANCELLED). Track tracking_number, staging_lane, total/expected carton count.
- **Loads** (`loads`): 10-state lifecycle (PLANNED -> READY -> LOADING -> LOADED -> DEPARTED -> IN_TRANSIT -> ARRIVED -> DELIVERED -> CANCELLED -> CLOSED). Multi-stop support (load_stops, route_stops). Track trailer_number, seal_number, dock_door_number, BOL number.
- **Trailers** (`trailers`): Track trailer_number, carrier, type, status (ARRIVED...), assigned load/dock, seal_number, arrival/departure time.
- **Yard Vehicles** (`yard_vehicles`): Yard tractor/trailer management.
- **Shipping Labels** (`shipping_labels`): Carrier shipping labels.
- **Shipment Status History** (`shipment_status_history`): Immutable status transition log.
- **Shipping Audit Log** (`shipping_audit_log`): Immutable audit trail.
- **Shipping Routes** (`shipping_routes`, `route_stops`): Multi-stop delivery routes.
- **Bill of Lading** (`bill_of_lading`): BOL documents.
- **Force Close Authorizations** (`force_close_authorizations`): Supervisor authorization for closing trailers with incomplete shipments.
- **Carton Loading Confirmation** (`carton_loading_confirmation`): Two-phase load confirmation (validate -> confirm).
- **Generated Manifests** (`generated_manifests`): Manifest documents with manifest_data_json.

### 22.2 RF capabilities (24 endpoints)

- `POST /rf/outbound/shipping/start-load` — Start loading session — scan dock door, find or create load.
- `POST /rf/outbound/shipping/scan-trailer` — Validate trailer barcode, return status.
- `POST /rf/outbound/shipping/scan-lpn` — Scan shipping LPN to load onto trailer.
- `POST /rf/outbound/shipping/seal-trailer` — Record seal number on trailer.
- `POST /rf/outbound/shipping/close-trailer` — Close and seal trailer after loading complete.
- `POST /rf/outbound/shipping/get-next` — Get next loading work (directed assignment).
- `POST /rf/outbound/shipping/verify-shipment` — Verify all cartons for a shipment are loaded.
- `POST /rf/outbound/shipping/verify-load` — Verify all shipments on a load are complete.
- `POST /rf/outbound/shipping/close-shipment` — Close individual shipment.
- `POST /rf/outbound/shipping/capacity` — Check trailer capacity before loading.
- `POST /rf/outbound/shipping/handoff` — Transfer custody to carrier (legal/operational event, driver name, signature).
- `POST /rf/outbound/shipping/bol` — View BOL data (RF).
- `POST /rf/outbound/shipping/manifest` — View/generate manifest (RF).
- `POST /rf/outbound/shipping/find-carton` — Find carton by barcode — return status and location.
- `POST /rf/outbound/shipping/load-summary` — Get load summary with shipments and carton counts.
- `POST /rf/outbound/shipping/shipment-cartons` — List all cartons for a shipment with statuses.
- `POST /rf/outbound/shipping/scan-pallet` — Scan pallet barcode to bulk-load all child cartons.
- `POST /rf/outbound/shipping/current-stop` — Get current multi-stop loading position.
- `POST /rf/outbound/shipping/next-stop` — Advance to next loading stop.
- `POST /rf/outbound/shipping/validate-carton` — Validate carton for loading — phase 1 before confirm.
- `POST /rf/outbound/shipping/confirm-load` — Confirm carton loaded — phase 2 after validate.
- `POST /rf/outbound/shipping/force-close` — Force close trailer with incomplete shipments — supervisor only.
- `POST /rf/outbound/shipping/undo-load` — Reverse last carton load.
- `POST /rf/outbound/shipping/reassign-shipment` — Reassign shipment to different load.

### 22.3 Web capabilities

- **Shipments** (`web/shipments`): CRUD + assign-carrier/stage/load/ship/close + audit timelines (11 endpoints).
- **Loads** (`web/loads`): CRUD + assign/remove shipment, start/complete loading, depart, BOL, stops, apply-route, manifest (14 endpoints).
- **Trailers** (`web/trailers`): CRUD + assign-load/assign-dock/depart (7 endpoints, CASL-guarded).

### 22.4 Manhattan WMS alignment

**Manhattan process emulated (three phases):**
- **Phase A — Staging:** (see section 21)
- **Phase B — Load Management:** `Create Load -> Scan Load -> Assign Trailer -> Load: CREATED -> PLANNED -> ASSIGNED`
- **Phase C — RF Trailer Loading:** `Get Loading Work -> Scan Trailer -> Scan Carton -> Physical Load -> Confirm Loaded -> Scan Next... -> Shipment Verification -> Close Shipment -> Close Load -> Manifest -> Carrier Handoff`

**Manhattan capabilities preserved:**
- Directed loading work ("Get Loading Work" by priority/door/trailer)
- **Shipment verification** (all expected cartons loaded before close — block closure if missing)
- **Multi-stop load sequencing** (last stop loaded FIRST, first stop loaded LAST — reverse order)
- **Pallet loading shortcut** (one pallet scan = many cartons)
- **Trailer capacity validation** (max weight/volume/pallets/cartons)
- **Carrier handoff / transfer of custody** (legal/operational event, driver name, signature)
- **Two-phase load confirmation** (validate -> confirm)
- **Force close** with supervisor authorization
- **Undo load** (reverse last carton load)
- **Manifest generation**
- **BOL viewing**

**Implementation status:** ~85% complete. Implemented: 24 RF endpoints, start-load, scan-trailer, scan-lpn, seal/close trailer, get-next directed work, verify-shipment/verify-load, close-shipment, capacity check, carrier handoff, BOL, manifest, find-carton, load-summary, shipment-cartons, scan-pallet (bulk load), current-stop/next-stop (multi-stop), validate-carton/confirm-load (two-phase), force-close (supervisor), undo-load, reassign-shipment. Remaining gaps: real carrier API integration for tracking numbers, real BOL document generation.

### 22.5 Key files

- `src/outbound/shipments/` — `shipment.service.ts`, `trailer.service.ts`
- `src/outbound/loads/` — `load.service.ts`
- `src/outbound/staging/` — `staging.service.ts`

---

## 23. Domain: Outbound — Value-Added Services (VAS)

### 23.1 Capability

VAS handles **additional services performed on products** beyond standard pick/pack/ship:

- **VAS Services** (`vas_services`, `vas_service_catalog`): Service catalog (kitting, labeling, gift wrap, etc.). Service code is the primary key for `vas_service_catalog`.
- **VAS Client Rates** (`vas_service_client_rates`): Per-client pricing for VAS services.
- **VAS Workstations** (`vas_workstations`): Workstation check-in/check-out for VAS operators.
- **VAS Execution Tasks** (`vas_execution_tasks`): Task with quantity_required/completed, status (PENDING...), charge_status (UNBILLED...), source wave/picking task link.
- **VAS Task Events** (`vas_task_events`): Immutable event log.
- **VAS Execution Charges** (`vas_execution_charges`): Charges for executed VAS.
- **VAS Transactions** (`vas_transactions`): Transaction log.

### 23.2 RF capabilities (3 endpoints)

- `POST /rf/vas/workstations` — List workstations (RF).
- `POST /rf/vas/workstations/:id/check-in` — Check in to workstation (audited: `VAS_WORKSTATION_CHECK_IN`).
- `POST /rf/vas/workstations/:id/check-out` — Check out of workstation (audited: `VAS_WORKSTATION_CHECK_OUT`).

### 23.3 Web capabilities

- **VAS Catalog** (`web/vas` services/client-rates/workstations): CRUD for VAS services + client rates + workstations (10 endpoints, CASL-guarded).
- **VAS Execution** (`web/vas` tasks/charges): CRUD for VAS execution tasks + start/complete + charges list (8 endpoints, CASL-guarded).

### 23.4 Manhattan WMS alignment

Manhattan's VAS module (service catalog, client-specific pricing, workstation assignment, execution tracking, billing) is mirrored. The charge_status (UNBILLED -> BILLED) lifecycle supports billing integration (see section 31).

### 23.5 Key files

- `src/outbound/vas-catalog/` — `vas-catalog.service.ts`
- `src/outbound/vas-execution/` — `vas-execution.service.ts`

---

## 24. Domain: Quality Management

### 24.1 Capability

Quality management extends beyond inbound inspection to include **compliance and hazmat**:

- **Compliance Requirements** (`compliance_requirements`): Regulatory compliance tracking. Category, regulatory body, compliance frequency, next due date, priority, responsible role.
- **Compliance Audits** (`compliance_audits`): Audit tracking with score, findings, follow-up required flag.
- **Hazmat Materials** (`hazmat_materials`): Hazardous material definitions.

(See also section 13 for Inbound Quality Inspection, which is the core QC execution flow.)

### 24.2 Web capabilities (10 controllers)

- **Quality Holds** (`web/quality-holds`): CRUD + release (6 endpoints).
- **NCRs** (`web/non-conformance-reports`): CRUD (5 endpoints).
- **Receiving Inspections** (`web/receiving-inspections`): Create/list/get/delete (4 endpoints).
- **QC Dispositions** (`web/qc-dispositions`): Create/list/delete (3 endpoints).
- **Compliance Requirements** (`web/compliance-requirements`): CRUD (5 endpoints).
- **Compliance Audits** (`web/compliance-audits`): CRUD (5 endpoints).
- **Hazmat Materials** (`web/hazmat-materials`): CRUD (5 endpoints).
- **Inspections** (`web/quality/inspections`): Pending-review + supervisor-approve/reject (3 endpoints).
- **Defect Codes** (`web/defect-codes`): CRUD + seed (5 endpoints).
- **Inspection Profiles** (`web/inspection-profiles`): CRUD + assign-product + by-product (6 endpoints).

### 24.3 Manhattan WMS alignment

Manhattan's quality management (inspection profiles, defect codes, NCRs, compliance) is mirrored. The compliance requirements/audits extend beyond Manhattan's core QC to support regulatory compliance tracking.

### 24.4 Key files

- `src/quality/compliance/` — `compliance.service.ts`
- `src/quality/inspections/` — `inspection.service.ts`, `inspection-profile.service.ts`
- `src/quality/defects/` — `defect-code.service.ts`
- `src/quality/holds/` — `quality-hold.service.ts`
- `src/quality/ncr/` — `ncr.service.ts`

---

## 25. Domain: Transfers

### 25.1 Capability

Transfers handle **internal inventory movements** between locations, facilities, or zones:

- **Inventory Transfers** (uses `inventory_transactions` with `transaction_type` = TRANSFER/TRANSFER_IN/TRANSFER_OUT): No dedicated transfer model; transfers are recorded as inventory transactions.

### 25.2 RF capabilities (3 endpoints)

- `POST /rf/transfers/initiate` — Initiate transfer (RF).
- `POST /rf/transfers/scan-lpn` — Scan LPN for transfer (RF).
- `POST /rf/transfers/complete` — Complete/receive transfer (RF).

### 25.3 Web capabilities (8 endpoints, CASL-guarded)

- **Transfers** (`web/transfers`): CRUD (no update) + lines + dispatch/receive/cancel.

### 25.4 Manhattan WMS alignment

Manhattan's transfer model (initiate -> dispatch -> receive) is mirrored. The use of `inventory_transactions` with TRANSFER_IN/TRANSFER_OUT types matches Manhattan's transaction-based inventory movement recording.

### 25.5 Key files

- `src/transfers/` — `transfers.service.ts`

---

## 26. Domain: Work Orders

### 26.1 Capability

Work orders handle **light manufacturing / kitting / assembly** operations:

- **Work Orders** (`work_orders`): Work order number, type (default ASSEMBLY), product, planned/fulfilled/remaining quantity, status (PENDING...), progress percentage, assigned user.
- **Work Order Components** (`work_order_components`): Bill of materials — component product, required/issued quantity, status.
- **Work Order Operations** (`work_order_operations`): Operation sequence, required equipment type, assigned user, status.

### 26.2 RF capabilities (3 endpoints)

- `POST /rf/work-orders/my-tasks` — Get my in-progress work-order tasks (RF).
- `POST /rf/work-orders/:id/start-operation` — Start a work-order operation (RF).
- `POST /rf/work-orders/:id/complete-operation` — Complete a work-order operation (RF).

### 26.3 Web capabilities (13 endpoints, CASL-guarded)

- **Work Orders** (`web/work-orders`): CRUD + release/complete/cancel + operations list/start/delete + components list/add/delete.

### 26.4 Manhattan WMS alignment

Manhattan's work order module (assembly/kitting with BOM and operations) is mirrored. The operation sequence with required equipment type supports Manhattan's manufacturing-adjacent WMS capabilities.

### 26.5 Key files

- `src/work-orders/` — `work-orders.service.ts`, `components.service.ts`, `operations.service.ts`

---

## 27. Domain: Labor Management

### 27.1 Capability

Labor management tracks **operator time and performance**:

- **Labor Shifts** (`labor_shifts`): Shift name, code, start/end time, break duration.
- **Labor Shift Assignments** (`labor_shift_assignments`): User-to-shift assignment per date, status (SCHEDULED...).
- **Labor Time Logs** (`labor_time_logs`): Clock in/out, total/net worked minutes, status (CLOCKED_IN...).
- **Labor Performance Metrics** (`labor_performance_metrics`): Per user/date/task type — total tasks completed, efficiency percentage, items per hour.

### 27.2 RF capabilities (3 endpoints)

- `POST /rf/labor/clock-in` — Clock in (RF).
- `POST /rf/labor/clock-out` — Clock out (RF).
- `POST /rf/labor/my-metrics` — Get my performance metrics (RF).

### 27.3 Web capabilities (9 endpoints, CASL-guarded)

- **Performance** (`web/labor/performance`): List/delete metrics (2 endpoints).
- **Shifts** (`web/labor/shifts`): CRUD (5 endpoints).
- **Time Tracking** (`web/labor/time-logs`): List/delete time logs (2 endpoints).

### 27.4 Manhattan WMS alignment

Manhattan's labor management (shifts, assignments, time logs, performance metrics) is mirrored. The items-per-hour and efficiency-percentage metrics support Manhattan's labor standards.

### 27.5 Key files

- `src/labor/shifts/` — `shift.service.ts`
- `src/labor/time-tracking/` — `time-tracking.service.ts`
- `src/labor/performance/` — `performance.service.ts`

---

## 28. Domain: Equipment Management

### 28.1 Capability

Equipment management tracks **warehouse equipment** (forklifts, pallet jacks, scanners, printers):

- **Warehouse Equipment** (`warehouse_equipment`): Equipment name, code, type (FORKLIFT, PALLET_JACK, HAND_TRUCK, CONVEYOR, SCANNER, PRINTER, COMPUTER, OTHER), status (AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE, DECOMMISSIONED), current location, assigned user, last/next maintenance date.
- **Equipment Maintenance** (`equipment_maintenance`): Maintenance type, date, next maintenance date, performed by, status.

### 28.2 RF capabilities (3 endpoints)

- `POST /rf/equipment/available` — List available equipment (RF).
- `POST /rf/equipment/:id/check-out` — Check out equipment (set IN_USE).
- `POST /rf/equipment/:id/check-in` — Check in equipment (set AVAILABLE).

### 28.3 Web capabilities (12 endpoints, CASL-guarded)

- **Equipment** (`web/equipment`): CRUD + status update (6 endpoints).
- **Maintenance** (`web/equipment/maintenance`): CRUD + complete (6 endpoints).

### 28.4 Manhattan WMS alignment

Manhattan's equipment management (check-out/check-out, maintenance scheduling) is mirrored. The equipment type enum covers Manhattan's MHE (Material Handling Equipment) categories.

### 28.5 Key files

- `src/equipment/` — `equipment.service.ts`
- `src/equipment/maintenance/` — `maintenance.service.ts`

---

## 29. Domain: Dock-Yard Management

### 29.1 Capability

Dock-yard management handles **dock appointments and yard vehicle tracking**:

- **Dock Appointments** (`dock_appointments`): Appointment scheduling for inbound/outbound docks. Status (REQUESTED...). Track carrier, trailer, appointment time.
- **Yard Vehicles** (`yard_vehicles`): Yard tractor/trailer tracking. Status (IN_YARD...). Assigned dock.

### 29.2 RF capabilities (1 endpoint)

- `POST /rf/dock-appointments/upcoming` — List upcoming dock appointments (RF).

### 29.3 Web capabilities (14 endpoints, CASL-guarded)

- **Dock Appointments** (`web` dock-appointments routes): CRUD + check-in/complete/cancel.
- **Yard Vehicles** (`web` yard/vehicles routes): CRUD + assign-dock/depart.

### 29.4 Manhattan WMS alignment

Manhattan's dock scheduling and yard management (YMS) is mirrored. The dock appointment lifecycle (REQUESTED -> CHECKED_IN -> COMPLETE -> CANCELLED) supports Manhattan's dock door management.

### 29.5 Key files

- `src/dock-yard/` — `dock-yard.service.ts`

---

## 30. Domain: Exceptions Management

### 30.1 Capability

Exceptions management provides a **cross-cutting exception tracking and escalation system**:

- **Exception Management** (`exception_management`): Exception number, type (INVENTORY_DISCREPANCY, QUALITY_ISSUE, TASK_EXCEPTION, EQUIPMENT_FAILURE, SAFETY_VIOLATION, PROCESS_DEVIATION, DOCUMENTATION_ERROR, OTHER), severity (LOW, MEDIUM, HIGH, CRITICAL), reference type/ID, status (OPEN...), reported by, assigned to.
- **Exception Comments** (`exception_comments`): Threading/comments on exceptions.
- **Exception Escalation Rules** (`exception_escalation_rules`): Auto-escalation rules with responsible role, notify roles, auto-assign to role.

### 30.2 RF capabilities (1 endpoint)

- `POST /rf/exceptions/report` — Report an exception from RF device.

### 30.3 Web capabilities (14 endpoints, CASL-guarded)

- **Exceptions** (`web/exceptions`): CRUD + acknowledge/resolve + comments list/add (9 endpoints).
- **Escalation Rules** (`web/escalation-rules`): CRUD (5 endpoints).

### 30.4 Manhattan WMS alignment

Manhattan's exception management (task exceptions, inventory discrepancies, quality issues) is mirrored. The escalation rules with auto-assign-to-role support Manhattan's exception workflow automation.

### 30.5 Key files

- `src/exceptions/` — `exception-management.service.ts`, `exception-escalation.service.ts`, `exception-comment.service.ts`

---

## 31. Domain: Billing

### 31.1 Capability

Billing handles **3PL storage and VAS charge calculation**:

- **Billing Cycles** (`billing_cycles`): Cycle number, client, start/end date, billing frequency, status (OPEN...), grand total.
- **Client Invoices** (`client_invoices`, `client_invoice_lines`): Invoice with total storage/VAS charges, payment status (OPEN...).
- **Storage Billing Cycles** (`storage_billing_cycles`): Storage-specific billing cycles.
- **Storage VAS Invoices** (`storage_vas_invoices`, `storage_vas_invoice_lines`): Combined storage + VAS invoices.
- **Storage Charges** (`storage_charges`): Per product/lot — storage start date, days in storage, volumetric weight, charge amount.
- **Storage Rates** (`storage_rates`), **Storage Rate Master** (`storage_rate_master`): Rate configuration.
- **Storage Inventory Snapshots** (`storage_inventory_snapshots`): Daily inventory snapshots for billing calculation.
- **Charge Calculation Rules** (`charge_calculation_rules`): Configurable charge rules.
- **VAS Services/Client Rates/Execution Charges/Transactions**: (see section 23).

### 31.2 Web capabilities (18 endpoints, CASL-guarded)

- **Billing** (`web/billing`): CRUD for storage-rates, client-rates, billing cycles; snapshots list/generate; charges list; invoices list/get/generate/delete.

### 31.3 Manhattan WMS alignment

Manhattan's 3PL billing (storage charges based on days/volumetric weight, VAS charges, client-specific rates, billing cycles, invoices) is mirrored. The snapshot-based storage calculation supports Manhattan's daily inventory snapshot billing model.

### 31.4 Key files

- `src/billing/invoicing/` — `invoice.service.ts`
- `src/billing/storage/` — `charge.service.ts`, `client-rate.service.ts`, `snapshot.service.ts`, `storage-rate.service.ts`

---

## 32. Domain: Fulfillment Workflow & Billing

### 32.1 Capability

Fulfillment workflow provides a **generic workflow engine** for fulfillment processes with integrated billing:

- **Fulfillment Workflow Definitions** (`fulfillment_workflow_definitions`): Workflow code, entity type, initial status, auto-progression enabled, require manual approval, max retry attempts.
- **Fulfillment Workflow Transitions** (`fulfillment_workflow_transitions`): From/to status, transition name, condition expression, require approval, automation handler, automation enabled.
- **Fulfillment Workflow Events** (`fulfillment_workflow_events`): Entity type/ID, from/to status, event status (PENDING...), handler name, retry count, next retry at.
- **Fulfillment Workflow Executions** (`fulfillment_workflow_executions`): Handler name, execution status (RUNNING...), entities created, error message, parent execution.
- **Fulfillment Billing Runs** (`fulfillment_billing_runs`): Execution status (PENDING...).
- **Fulfillment Billing Run Events** (`fulfillment_billing_run_events`): Join table.
- **Fulfillment Billing Events** (`fulfillment_billing_events`): Event type, source entity, client, charge amount, billing status (UNBILLED...), invoice link.

### 32.2 Web capabilities (15 endpoints, CASL-guarded)

- **Fulfillment** (`web` fulfillment routes): CRUD for workflow-definitions + executions/events/transitions list.
- **Fulfillment Billing** (`web` fulfillment-billing routes): CRUD for billing-runs + link-events/status; billing-events create/list + charges calculate.

### 32.3 Manhattan WMS alignment

This domain extends beyond Manhattan's core WMS with a generic fulfillment workflow engine. The workflow transition condition expression and automation handler support Manhattan's configurable workflow automation. The billing event lifecycle (UNBILLED -> BILLED) integrates with the billing domain (section 31).

### 32.4 Key files

- `src/fulfillment/` — `fulfillment-workflow.service.ts`, `fulfillment-billing.service.ts`

---

## 33. Domain: Workflow Engine (BPMN / State Machine / Rules)

### 33.1 Capability

The workflow domain provides **four distinct workflow engines** for process automation:

1. **BPMN Engine** (`src/workflow/bpmn/`): BPMN 2.0 process definition execution using `bpmn-engine` + `camunda-bpmn-moddle`.
   - **BPMN Process Definitions**: CRUD + start (6 endpoints, CASL-guarded).
2. **State Machine Engine** (`src/workflow/state-machine/`): XState-based state machine definitions.
   - **State Machines**: CRUD + execute (6 endpoints, CASL-guarded).
3. **Rule Engine** (`src/workflow/rule-engine/`): DMN decision table evaluation using `@gorules/zen-engine` + `zod` validation.
   - **Rules**: CRUD + evaluate (6 endpoints, CASL-guarded).
4. **Workflow Orchestrator** (`src/workflow/orchestrator/`): Orchestrates workflow executions with recovery.
   - **Executions**: List/get execution instances (state machine + BPMN) (2 endpoints, CASL-guarded).
   - **Workflow Recovery Processor** (`workflow-recovery.processor.ts`): BullMQ job for recovering failed workflow executions.

### 33.2 Manhattan WMS alignment

Manhattan WMS uses configurable workflow automation for status transitions. This platform's four-engine approach (BPMN, State Machine, Rules, Orchestrator) provides a more generalized workflow capability than Manhattan's built-in workflow engine. The `fulfillment_workflow_transitions` table with `condition_expression` and `automation_handler` (section 32) is the primary mechanism for WMS-specific workflow automation.

### 33.3 Key files

- `src/workflow/bpmn/` — `bpmn.service.ts`
- `src/workflow/state-machine/` — `state-machine.service.ts`
- `src/workflow/rule-engine/` — `rule-engine.service.ts`
- `src/workflow/orchestrator/` — `workflow-orchestrator.service.ts`, `workflow-recovery.processor.ts`

---

## 34. Domain: Integrations

### 34.1 Capability

Integrations handle **external system connectivity**:

- **Entity Mapping** (`entity-mapping/`): External-to-internal ID mapping for syncing entities between systems.
- **Sync Logs** (`sync-logs/`): Integration audit trail.
- **Webhooks** (`webhooks/`): Inbound webhook receiver.

> **Note:** The `adapters/` and `processors/` directories exist but are **empty** (scaffolding for future external system adapters and sync processors).

### 34.2 Web capabilities (8 endpoints, partially CASL-guarded)

- **Integration** (`web/integration`): Receive webhooks + webhook-logs; entity-mappings CRUD; sync-logs list/delete.

### 34.3 Manhattan WMS alignment

Manhattan WMS has integration frameworks for ERP, OMS, and TMS connectivity. This platform's entity-mapping + sync-logs + webhooks pattern supports Manhattan-style integration, though the actual adapters are not yet implemented.

### 34.4 Key files

- `src/integrations/entity-mapping/` — `entity-mapping.service.ts`
- `src/integrations/sync-logs/` — `sync-log.service.ts`
- `src/integrations/webhooks/` — `webhook.service.ts`

---

## 35. Domain: Reports

### 35.1 Capability

Reports provides **async report generation**:

- **Reports** (`reports.service.ts`): Generate report (queued BullMQ job), list/get/download/delete report jobs.

### 35.2 Web capabilities (5 endpoints, CASL-guarded)

- **Reports** (`web/reports`): Generate report (queued job) + list/get/download/delete jobs.

### 35.3 Key files

- `src/reports/` — `reports.service.ts`, `report.processor.ts` (BullMQ)

---

## 36. Domain: Analytics & KPIs

### 36.1 Capability

Analytics provides **warehouse performance visualization**:

- **Pick Heatmap** (`location_pick_heatmap`): Per location/zone — total picks, pick density score, density class, picks per day, zone rank. Consumed by `HeatmapWebController`.
- **Daily KPI Metrics** (`daily_kpi_metrics`): Per facility/date — ASNs received, GRNs created, units received, orders received, orders shipped, picking tasks completed, inventory accuracy %, defect rate %, order fill rate %, units per labor hour. Consumed by `KpiWebController`.

### 36.2 Web capabilities (4 endpoints, CASL-guarded)

- **Heatmap** (`web/analytics/heatmap`): Pick location heatmap + top pick locations (2 endpoints).
- **KPIs** (`web/analytics/kpi`): Daily KPI metrics + summary (2 endpoints).

### 36.3 Manhattan WMS alignment

Manhattan WMS provides warehouse analytics dashboards (pick heatmaps, KPIs, labor productivity). This platform mirrors the heatmap and daily KPI metrics. The KPI fields (inventory accuracy, defect rate, order fill rate, units per labor hour) align with Manhattan's standard WMS KPIs.

### 36.4 Key files

- `src/analytics/heatmap/` — consumes `src/observability/heatmap/heatmap.service.ts`
- `src/analytics/kpi/` — consumes `src/observability/kpi/kpi.service.ts`

---

## 37. Domain: Observability

### 37.1 Capability

Observability provides **full-stack operational visibility**:

- **Audit** (`src/observability/audit/`): `AuditInterceptor` (global, writes to `system_audit_log`) + `audit-log.service.ts` + `AuditController` (list/get/delete audit logs).
- **Events** (`src/observability/events/`): Domain event store + `EventsController` (list/get/delete warehouse events).
- **Heatmap** (`src/observability/heatmap/`): `heatmap.service.ts` — warehouse activity heatmap calculation.
- **KPI** (`src/observability/kpi/`): `kpi.service.ts` — KPI metric calculation.
- **Metrics** (`src/observability/metrics/`): `metrics.service.ts` + `@willsoto/nestjs-prometheus` -> `/metrics` endpoint (Prometheus format).
- **Tracing** (`src/observability/tracing/`): OpenTelemetry SDK with OTLP HTTP exporter. Instruments HTTP, PostgreSQL (`pg`), and Redis 4+.

### 37.2 Web capabilities (6 endpoints, CASL-guarded)

- **Events** (`web/events`): List/get/delete warehouse events (3 endpoints).
- **Audit Logs** (`web/audit-logs`): List/get/delete audit logs (3 endpoints).

### 37.3 Key files

- `src/observability/audit/` — `audit-log.service.ts`, `audit.interceptor.ts`
- `src/observability/events/` — `event.service.ts`
- `src/observability/heatmap/` — `heatmap.service.ts`
- `src/observability/kpi/` — `kpi.service.ts`
- `src/observability/metrics/` — `metrics.service.ts`, `metrics.module.ts`
- `src/observability/tracing/` — `tracing.service.ts`, `otlp-exporter.ts`, `tracing.module.ts`

---

## 38. Domain: Settings

### 38.1 Capability

Settings provides **system-wide configuration management**:

- **System Settings**: Key-value configuration with history tracking.

### 38.2 Web capabilities (7 endpoints, CASL-guarded)

- **Settings** (`web/settings`): List/get-by-key/upsert/update/delete system settings + defaults + history.

### 38.3 Key files

- `src/settings/` — `settings.service.ts`

---

## 39. Domain: Security — Supervisor PIN

### 39.1 Capability

Supervisor PIN provides **PIN-based supervisor authentication** for RF override scenarios:

- **Supervisor Pins** (`supervisor_pins` table, created via raw SQL in `prisma/migrations/missing_tables.sql:91-100`): PIN hash, user ID, active flag. Accessed exclusively through `$queryRawUnsafe` in `SupervisorPinService`.

When a JWT has `authMethod === 'pin'`, the ability factory restricts abilities to read/validate-only (cannot Delete/Create/Update/Approve — see section 5.4).

### 39.2 Web capabilities (4 endpoints, CASL-guarded)

- **Supervisor Pins** (`web/supervisor-pins`): Create PIN + verify (current user) + verify-by-id + deactivate.

### 39.3 Key files

- `src/security/` — `supervisor-pin.service.ts`

---

## 40. Domain: Health & Lifecycle

### 40.1 Health Check

- **Health** (`web/health`): `GET /api/v1/wms/health` — `@Public` endpoint checking DB + Redis connectivity. Uses NestJS terminus health indicators.

### 40.2 Lifecycle / Graceful Shutdown

- **ShutdownService** (`src/lifecycle/shutdown.service.ts`): Graceful shutdown with connection draining.
- **ShutdownDrainMiddleware** (`src/lifecycle/shutdown-drain.middleware.ts`): Registered globally. Rejects new requests during graceful shutdown. Configurable via `SHUTDOWN_TIMEOUT_MS=15000` default.
- **Deployment Modes**: `rolling`, `blue-green`, `standalone` (configurable via `DEPLOYMENT_MODE`).

### 40.3 Key files

- `src/health/` — `health.controller.ts`
- `src/lifecycle/` — `shutdown.service.ts`, `shutdown-drain.middleware.ts`

---

## 41. Data Model Summary

### 41.1 Scale

- **184 Prisma models** in a single `multitenant` PostgreSQL schema.
- **41 enums** covering statuses, types, reasons, and categories.
- **~178 models** carry `tenant_id` (UUID) for multi-tenant isolation.
- **181 models** use BigInt autoincrement PKs; 1 uses UUID PK (`db_rf_sessions`); 1 uses String natural PK (`vas_service_catalog`); 1 uses Int PK (`flyway_schema_history`).

### 41.2 Enums (41)

`adjustment_reason_enum`, `approval_level`, `approval_status`, `asn_status`, `bay_status`, `count_frequency_type`, `count_method`, `count_priority`, `disposition_action_enum`, `equipment_status`, `equipment_type`, `exception_severity`, `exception_type`, `facility_type`, `hold_reason`, `hold_status`, `investigation_status`, `load_status`, `location_type`, `lpn_status`, `lpn_transaction_type`, `lpn_type`, `order_line_status`, `order_line_status_old`, `order_status`, `order_type`, `packing_session_status`, `period_type`, `qc_result_enum`, `quality_hold_status`, `quantity_uom_enum`, `receipt_status`, `sampling_method`, `shipment_status`, `task_status`, `task_status_old`, `task_type`, `transaction_status`, `transaction_type`, `variance_reason`, `zone_type`.

### 41.3 Status state-machine fields on key operational models

| Model | Field | Type | States |
|---|---|---|---|
| `advance_ship_notices` | `status` | enum `asn_status` | 8 states (CREATED -> CLOSED/CANCELLED) |
| `goods_receipts` | `status` | enum `receipt_status` | 9 states |
| `sales_orders` | `status` | enum `order_status` | 12 states |
| `sales_order_lines` | `status` | enum `order_line_status` | 12 states |
| `picking_tasks` | `status` | enum `task_status` | 8 states |
| `putaway_tasks` | `status` | enum `task_status_old` | 6 states (legacy) |
| `packing_sessions` | `status` | enum `packing_session_status` | 6 states |
| `outbound_shipments` | `status` | enum `shipment_status` | 7 states |
| `loads` | `status` | enum `load_status` | 10 states |
| `license_plate_numbers` | `status` | enum `lpn_status` | 16 states (full LPN lifecycle) |
| `inventory_transactions` | `transaction_status` | enum `transaction_status` | 5 states |
| `inventory_holds` | `status` | enum `hold_status` | 4 states |
| `quality_holds` | `status` | enum `quality_hold_status` | 3 states |
| `variance_investigations` | `status` | enum `investigation_status` | 6 states |
| `adjustment_approval_requests` | `status` | enum `approval_status` | 5 states |
| `warehouse_equipment` | `status` | enum `equipment_status` | 5 states |
| `bays` | `status` | enum `bay_status` | 7 states |

### 41.4 Status-history / audit-trail companion models

Several operational models have dedicated immutable status-history tables:
- `shipment_status_history` (for outbound_shipments)
- `packing_session_status_history` (for packing_sessions)
- `shipping_audit_log`, `pick_audit_log`, `cycle_count_events` (immutable event logs)
- `quality_inspection_events`, `vas_task_events`, `lpn_transactions`, `inventory_transactions` (transactional audit)

---

## 42. OpenAPI / Client Generation

### 42.1 Swagger UI

When `SWAGGER_ENABLED=true`, the Swagger UI is available at `http://localhost:3002/api/docs`. The OpenAPI spec is at `http://localhost:3002/api/docs-json`.

The spec is built with `DocumentBuilder`:
- Title: "WMS API"
- Description: "Warehouse Management System API"
- Version: 1.0
- Auth: Bearer

### 42.2 Auto-generated TypeScript client

The repository includes `generate-api-client.sh` which uses **Orval** to generate a TypeScript client from the live Swagger spec:

- **Output directory:** `generated-client/`
- **Contents:**
  - `openapi-specs/wms-api.json` — the full OpenAPI spec (549 paths, 1048+ schemas)
  - `lib/api/` — Orval-generated API functions organized by OpenAPI tags (via `mode: 'tags-split'`)
  - `lib/types/` — TypeScript type definitions for all schemas
  - `lib/http/httpClient.ts` — HTTP client boilerplate (custom instance)
  - `lib/queryClient.ts` — React Query query client configuration
  - `hooks/` — React Query hooks (queries + mutations)
  - `ai-prompts/` — 4 AI prompt templates for client development
  - `.env.example` — environment variable template

> **Note:** The `generated-client/` directory is **excluded from the NestJS build** (`tsconfig.build.json` excludes it) because it uses frontend-oriented libraries (`@tanstack/react-query`, `axios`) not installed in the backend. It is intended for consumption by the `wms-app` frontend.

### 42.3 Excluded from build

`tsconfig.build.json`:
```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "generated-client", "**/*spec.ts"]
}
```

---

## 43. Appendix A — Manhattan WMS RF Menu Mapping

### 43.1 Alignment philosophy

The platform benchmarks itself against the **Manhattan WMS RF Operations Suite** (`Manhattan_RF_Operations_Suite_v1/`, 20 documents). The alignment is **functional/process-level** (replicating the operator workflow and validation rules), **not** transaction-code-level or RF-screen-format-level.

Formal Manhattan transaction codes (`mlist`, `confirmReceipt`, `mcommands`, ACTIVE-directory screen definitions) are **not used** in this codebase. The reference suite describes RF menus narratively. The emulated "menu paths" map to NestJS route prefixes.

### 43.2 Per-domain Manhattan RF menu mapping

| Manhattan Menu Concept | Emulated Route Prefix | Domain |
|---|---|---|
| Inbound -> Check In Trailer | `rf/inbound/trailer/check-in` | Inbound Receiving |
| Inbound -> Assign Door | `rf/inbound/trailer/assign-door` | Inbound Receiving |
| Inbound -> Receive (scan/qty/damage) | `rf/inbound/receive/*` | Inbound Receiving |
| Inbound -> Supervisor Approve Variance | `rf/inbound/receive/approve-variance` | Inbound Receiving |
| Returns -> Receive/Disposition/Complete | `rf/inbound/returns/*` | Inbound Receiving |
| PO -> Start Receiving | `rf/purchase-orders/start-receiving` | Inbound Receiving |
| QC -> Get Work / Scan LPN / Validate | `rf/quality/inspections/*` | Quality Inspection |
| Putaway -> Get Work / Scan / Location-Full / Damage | `rf/inbound/putaway/*` | Inbound Putaway |
| Cycle Count -> Start / Scan / Enter-Qty / Submit / Approve | `rf/cycle-counts/*` | Inventory Cycle Count |
| Picking -> Setup-Cluster / Distribute / Batch / Confirm | `rf/outbound/pick/*` | Outbound Picking |
| Packing -> Get-Next / Verify-Carton / Capture-Weight | `rf/outbound/pack/*` | Outbound Packing |
| Staging -> Get-Next / Scan-Carton / Confirm-Lane | `rf/outbound/staging/*` | Outbound Staging |
| Shipping -> Get-Next / Start-Load / Scan-LPN / Close-Trailer / Verify | `rf/outbound/shipping/*` | Outbound Shipping |

### 43.3 Manhattan domain concepts preserved

| Manhattan Concept | Implementation |
|---|---|
| LPN (License Plate Number) | `license_plate_numbers` — 16-state lifecycle, 7 types, nesting support |
| ASN (Advance Ship Notice) | `advance_ship_notices` — 8-state lifecycle, async import |
| Dock Door | `loading_docks` + dock appointment validation |
| Staging Lane | `staging_lanes` — typed (CARRIER/ROUTE/DOOR/WAVE) |
| Wave | `picking_waves` + `wave_orders` |
| Cluster Pick | `cluster_pick_groups` + `pick_carts` + 4 RF endpoints |
| Cartonization | `cartonization_rules` + `customer_cartonization_preferences` + `packing_carton_plan` |
| Multi-stop Load | `loads` + `load_stops` + `route_stops` + `current-stop`/`next-stop` RF endpoints |
| Custody Transfer | `POST /rf/outbound/shipping/handoff` |
| Directed Work / "Get Work" | `get-next` / `next-task` / `next-count-work` RF endpoints across all domains |
| Supervisor Review | `pending-approvals` / `pending-reviews` / `pending-exceptions` + `approve`/`reject` RF endpoints |
| Tolerance / Approval Gates | `receiving_tolerance_configs` + `approval_threshold_configs` + `adjustment_approval_requests` |
| Pack Station Lifecycle | `packing_stations` — AVAILABLE -> ASSIGNED -> ACTIVE -> RELEASED |

### 43.4 Implementation status by domain

| Domain | Manhattan Process | Implementation Status |
|---|---|---|
| Inbound Receiving | Trailer Check-In -> Dock -> ASN -> Scan -> Qty -> Tolerance -> Damage -> LPN -> Stage -> Complete | ~80% |
| Quality Inspection | QC_HOLD -> Get Work -> Scan LPN -> Checklist -> Findings -> Validate -> PASS/FAIL -> Supervisor | ~40% |
| Putaway | Get Work -> Scan LPN -> Directed Destination -> Confirm -> Location Full / Damage | ~75% |
| Cycle Count | Get Count Work -> Scan -> Blind Count -> Enter Qty -> Variance -> Auto-Approve / Recount -> Supervisor -> Root Cause | ~55% |
| Outbound Picking | Wave -> Allocate -> Generate Tasks -> Cluster/Batch/Case/Pallet -> Get Work -> Scan -> Pick -> Confirm -> Short Pick -> Wave Completion | ~65% |
| Outbound Packing | Assign Station -> Get Pack Work -> Scan LPN -> Carton -> Nest -> Verify -> Weight -> Close -> Label -> Slip -> Cartonization -> Exceptions | ~85% |
| Outbound Staging | Get Staging Work -> Scan Carton -> Move to Lane -> Scan Location -> STAGED | ~90% |
| Outbound Shipping | Get Loading Work -> Scan Trailer -> Scan Carton -> Confirm -> Verify Shipment -> Close -> Manifest -> Handoff | ~85% |

---

## 44. Appendix B — Configuration Reference

### 44.1 Environment variables (validated by Joi at startup — `src/config/app.config.ts`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `3002` | HTTP listen port |
| `API_PREFIX` | No | `api/v1/wms` | Global API route prefix |
| `APP_URL` | No | `http://localhost:3002` | Application URL |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (must include `?schema=multitenant`) |
| `PGBOUNCER_ENABLED` | No | `false` | PgBouncer toggle |
| `DB_POOL_LIMIT` | No | `20` | Prisma connection pool limit |
| `JWT_ACCESS_SECRET` | **Yes** (min 8 chars) | — | JWT verification secret (current) |
| `JWT_REFRESH_SECRET` | **Yes** (min 8 chars) | — | Refresh token secret (handled by SaaS Core) |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token expiry |
| `JWT_ACCESS_SECRET_OLD` | No | (empty) | Old secret for key rotation |
| `CORE_API_URL` | **Yes** (URI) | — | SaaS Core API URL |
| `CORE_API_TOKEN` | **Yes** (min 8 chars) | — | SaaS Core API token |
| `REDIS_HOST` | No | `localhost` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | (empty) | Redis password |
| `REDIS_MAXMEMORY` | No | `512mb` | Redis max memory |
| `REDIS_MAXMEMORY_POLICY` | No | `allkeys-lru` | Redis eviction policy |
| `OTLP_ENDPOINT` | No (URI) | — | OpenTelemetry OTLP HTTP endpoint |
| `METRICS_PATH` | No | `/metrics` | Prometheus metrics path |
| `SWAGGER_ENABLED` | No | `true` | Enable Swagger UI |
| `CORS_ORIGINS` | No | `*` | Allowed CORS origins |
| `RATE_LIMIT_GLOBAL_TTL` | No | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_GLOBAL_LIMIT` | No | `100` | Max requests per window |
| `SHUTDOWN_TIMEOUT_MS` | No | `15000` | Graceful shutdown timeout |
| `IDEMPOTENCY_TTL_MS` | No | `300000` | Idempotency key TTL (ms) |
| `DEPLOYMENT_MODE` | No | `standalone` | `rolling` / `blue-green` / `standalone` |
| `HEAP_WARNING_THRESHOLD_MB` | No | `1200` | Heap memory warning threshold |

### 44.2 Default ports

| Service | Port |
|---|---|
| WMS Backend | 3002 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### 44.3 Key URLs (development)

| URL | Purpose |
|---|---|
| `http://localhost:3002/api/v1/wms/health` | Health check (`@Public`) |
| `http://localhost:3002/api/docs` | Swagger UI |
| `http://localhost:3002/api/docs-json` | OpenAPI JSON spec |
| `http://localhost:3002/metrics` | Prometheus metrics |

---

## 45. Appendix C — Known Gaps & Limitations

This appendix documents **known limitations** in the current implementation. These are explicitly called out to ensure documentation, UI development, and customer communications do not assume capabilities that do not exist.

### 45.1 Authentication & Authorization gaps

- **RF endpoints do not use `@CheckAbility`:** Only `POST /rf/session/login` uses CASL `@CheckAbility`. All other RF endpoints rely solely on `@RfAction('read'|'create'|'update'|'delete')` enforced by `RfActionLightweightGuard`. Granular CASL subject/action authorization is **not** applied to RF handheld operations beyond login.
- **Two RF controllers have no guards:** `RfLocationController` (`POST /rf/locations/lookup`) and `RfProductController` (`POST /rf/products/lookup`) have no `@UseGuards` — `@RfAction('read')` is decorative/unenforced. These endpoints rely on the global `JwtAuthGuard` only.
- **Web guarding inconsistency:** Master-data, warehouse, and several inbound/outbound controllers have no `@CheckAbility` decorators — they rely on global JWT auth only, without CASL subject/action checks.
- **Integration controller subject mismatch:** `IntegrationWebController` references subjects `'Webhook'`, `'EntityMapping'`, `'SyncLog'` which are **not** in `WmsSubjects` — these would never match a granted ability.
- **JWT revocation not implemented:** `JwtValidationService` only decodes the payload and checks `iat` exists. Despite the "Token revoked or expired" error message, no real revocation lookup is performed.
- **`MANAGECYCLECOUNTSCHEDULE` action not in `mapAction`:** A permission code with action `MANAGECYCLECOUNTSCHEDULE` would silently fail to map in the ability factory.

### 45.2 Manhattan WMS RF workflow gaps

| Domain | Gap | Description |
|---|---|---|
| Inbound Receiving | Returns RF workflow | Stub implementation |
| Inbound Receiving | PO RF workflow | Stub implementation |
| Inbound Receiving | Proper staging step | Staging updates notes text only |
| Quality Inspection | Inspection profile execution | Full checklist execution flow incomplete |
| Quality Inspection | Statistical sampling | Enforcement not implemented |
| Quality Inspection | CONDITIONAL_PASS | Disposition logic incomplete |
| Putaway | Capacity/volume validation | Only weight checked |
| Putaway | Hazmat segregation | Not implemented |
| Putaway | Commingling prohibition | Not implemented |
| Putaway | Overflow location strategy | Not implemented |
| Putaway | Task interleaving | Not implemented |
| Cycle Count | Inventory adjustment on approval | On-hand update is partial |
| Cycle Count | ABC scheduling engine | Completeness partial |
| Outbound Picking | Wave completion check | Enforcement incomplete |
| Outbound Picking | Sortation station | Execution incomplete |
| Outbound Packing | Real carrier API | Stub (deterministic tracking number) |
| Outbound Packing | Real scale hardware | DummyScaleProvider only |
| Outbound Shipping | Real carrier API | Not integrated |
| Outbound Shipping | BOL document generation | Viewing only, no generation |

### 45.3 Data model gaps

- **No local users/roles/permissions tables:** User identity and roles are managed externally by SaaS Core. `user_id` is a UUID string pointing to an external IdP.
- **No dedicated transfer model:** Transfers use `inventory_transactions` with `TRANSFER`/`TRANSFER_IN`/`TRANSFER_OUT` types.
- **Legacy enums:** `task_status_old` and `order_line_status_old` indicate a migration in progress. `putaway_tasks` and `replenishment_tasks` still use the `_old` variants.
- **Mixed enum vs string status:** Newer models added at the end of the schema use plain `String` status fields instead of proper enums (staging, cluster picking, packing exceptions).
- **Inconsistent tenant_id typing:** `adjustment_approval_requests` and `variance_investigations` use `VarChar(255)` for `tenant_id` instead of `Uuid`.
- **Nullable tenant_id:** `client_invoices`, `storage_charges`, `storage_rate_master`, `vas_service_catalog` have nullable `tenant_id`.

### 45.4 Integration gaps

- **Empty adapters/processors:** `src/integrations/adapters/` and `src/integrations/processors/` are empty scaffolding.
- **No WebSocket gateways:** No `*.gateway.ts` files exist. Real-time push is not implemented.
- **No real carrier integration:** Tracking number generation is a stub.
- **No real scale hardware:** Only `DummyScaleProvider` implemented.

### 45.5 Documentation gaps

- **`README.md` is NestJS starter boilerplate:** It does not describe the WMS project. Project-specific guidance is in `NEW_PROJECT_GUIDE.md` and `PLANS/`.

---

*End of document.*
