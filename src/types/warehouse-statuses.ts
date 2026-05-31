// ============================================================
// Warehouse Status Enums, Configs, and Transition Maps
// All status values are stored as UPPER_SNAKE_CASE internally;
// display labels are human‑readable (e.g. "In Transit").
// ============================================================

// -----------------------------------------------------------
// ASN Status
// -----------------------------------------------------------
export enum AsnStatus {
  CREATED = 'CREATED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  IN_RECEIVING = 'IN_RECEIVING',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export const ASN_STATUS_TRANSITIONS: Record<AsnStatus, AsnStatus[]> = {
  [AsnStatus.CREATED]: [AsnStatus.IN_TRANSIT, AsnStatus.CANCELLED],
  [AsnStatus.IN_TRANSIT]: [AsnStatus.ARRIVED, AsnStatus.CANCELLED],
  [AsnStatus.ARRIVED]: [AsnStatus.IN_RECEIVING, AsnStatus.CANCELLED],
  [AsnStatus.IN_RECEIVING]: [AsnStatus.PARTIALLY_RECEIVED, AsnStatus.RECEIVED],
  [AsnStatus.PARTIALLY_RECEIVED]: [AsnStatus.IN_RECEIVING, AsnStatus.RECEIVED],
  [AsnStatus.RECEIVED]: [AsnStatus.CLOSED],
  [AsnStatus.CLOSED]: [],
  [AsnStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// GRN Line Status
// -----------------------------------------------------------
export enum GrnLineStatus {
  OPEN = 'OPEN',
  RECEIVED = 'RECEIVED',
  INSPECTING = 'INSPECTING',
  INSPECTED = 'INSPECTED',
  PUTAWAY_PENDING = 'PUTAWAY_PENDING',
  PUTAWAY_DONE = 'PUTAWAY_DONE',
  CANCELLED = 'CANCELLED',
}

export const GRN_LINE_STATUS_TRANSITIONS: Record<
  GrnLineStatus,
  GrnLineStatus[]
> = {
  [GrnLineStatus.OPEN]: [GrnLineStatus.RECEIVED, GrnLineStatus.CANCELLED],
  [GrnLineStatus.RECEIVED]: [GrnLineStatus.INSPECTING],
  [GrnLineStatus.INSPECTING]: [GrnLineStatus.INSPECTED],
  [GrnLineStatus.INSPECTED]: [GrnLineStatus.PUTAWAY_PENDING],
  [GrnLineStatus.PUTAWAY_PENDING]: [GrnLineStatus.PUTAWAY_DONE],
  [GrnLineStatus.PUTAWAY_DONE]: [],
  [GrnLineStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// ASN Line Status
// -----------------------------------------------------------
export enum AsnLineStatus {
  OPEN = 'OPEN',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export const ASN_LINE_STATUS_TRANSITIONS: Record<
  AsnLineStatus,
  AsnLineStatus[]
> = {
  [AsnLineStatus.OPEN]: [
    AsnLineStatus.PARTIALLY_RECEIVED,
    AsnLineStatus.RECEIVED,
    AsnLineStatus.CANCELLED,
  ],
  [AsnLineStatus.PARTIALLY_RECEIVED]: [AsnLineStatus.RECEIVED],
  [AsnLineStatus.RECEIVED]: [],
  [AsnLineStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// Order (Sales Order) Status
// -----------------------------------------------------------
export enum OrderStatus {
  CREATED = 'CREATED',
  VALIDATED = 'VALIDATED',
  ALLOCATED = 'ALLOCATED',
  RELEASED = 'RELEASED',
  PICKED = 'PICKED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.CREATED]: [OrderStatus.VALIDATED, OrderStatus.CANCELLED],
  [OrderStatus.VALIDATED]: [OrderStatus.ALLOCATED, OrderStatus.CANCELLED],
  [OrderStatus.ALLOCATED]: [OrderStatus.RELEASED, OrderStatus.CANCELLED],
  [OrderStatus.RELEASED]: [OrderStatus.PICKED, OrderStatus.CANCELLED],
  [OrderStatus.PICKED]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [],
  [OrderStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// Picking Task Status
// -----------------------------------------------------------
export enum PickingTaskStatus {
  CREATED = 'CREATED',
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  EXCEPTION = 'EXCEPTION',
  CANCELLED = 'CANCELLED',
}

export const PICKING_TASK_STATUS_TRANSITIONS: Record<
  PickingTaskStatus,
  PickingTaskStatus[]
> = {
  [PickingTaskStatus.CREATED]: [
    PickingTaskStatus.AVAILABLE,
    PickingTaskStatus.CANCELLED,
  ],
  [PickingTaskStatus.AVAILABLE]: [
    PickingTaskStatus.ASSIGNED,
    PickingTaskStatus.CANCELLED,
  ],
  [PickingTaskStatus.ASSIGNED]: [
    PickingTaskStatus.IN_PROGRESS,
    PickingTaskStatus.CANCELLED,
  ],
  [PickingTaskStatus.IN_PROGRESS]: [
    PickingTaskStatus.COMPLETED,
    PickingTaskStatus.ON_HOLD,
    PickingTaskStatus.EXCEPTION,
  ],
  [PickingTaskStatus.ON_HOLD]: [
    PickingTaskStatus.IN_PROGRESS,
    PickingTaskStatus.CANCELLED,
  ],
  [PickingTaskStatus.COMPLETED]: [],
  [PickingTaskStatus.EXCEPTION]: [
    PickingTaskStatus.IN_PROGRESS,
    PickingTaskStatus.CANCELLED,
  ],
  [PickingTaskStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// Cycle Count Status
// -----------------------------------------------------------
export enum CycleCountStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  VARIANCE = 'VARIANCE',
  CANCELLED = 'CANCELLED',
}

export const CYCLE_COUNT_STATUS_TRANSITIONS: Record<
  CycleCountStatus,
  CycleCountStatus[]
> = {
  [CycleCountStatus.PENDING]: [
    CycleCountStatus.IN_PROGRESS,
    CycleCountStatus.CANCELLED,
  ],
  [CycleCountStatus.IN_PROGRESS]: [
    CycleCountStatus.COMPLETED,
    CycleCountStatus.VARIANCE,
  ],
  [CycleCountStatus.COMPLETED]: [],
  [CycleCountStatus.VARIANCE]: [CycleCountStatus.IN_PROGRESS],
  [CycleCountStatus.CANCELLED]: [],
}

// -----------------------------------------------------------
// QC Status
// -----------------------------------------------------------
export enum QcStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

// -----------------------------------------------------------
// Variance Type
// -----------------------------------------------------------
export enum VarianceType {
  NONE = 'NONE',
  DAMAGED = 'DAMAGED',
  SHORT = 'SHORT',
  OVER = 'OVER',
}

// -----------------------------------------------------------
// Wave / Picking Task Status (legacy mapping for WaveList)
// -----------------------------------------------------------
export enum WaveStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
}

// -----------------------------------------------------------
// Load Status
// -----------------------------------------------------------
export enum LoadStatus {
  PLANNED = 'PLANNED',
  LOADED = 'LOADED',
  DEPARTED = 'DEPARTED',
  CANCELLED = 'CANCELLED',
}

// -----------------------------------------------------------
// LPN Status
// -----------------------------------------------------------
export enum LpnStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SHIPPED = 'SHIPPED',
  DAMAGED = 'DAMAGED',
}

// -----------------------------------------------------------
// Purchase Order Status (used in purchase orders)
// -----------------------------------------------------------
export enum PoStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}
