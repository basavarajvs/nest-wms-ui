import {
  AsnStatus,
  AsnLineStatus,
  GrnLineStatus,
  OrderStatus,
  PickingTaskStatus,
  CycleCountStatus,
  QcStatus,
  VarianceType,
  WaveStatus,
  LoadStatus,
  LpnStatus,
  PoStatus,
} from '@/types/warehouse-statuses'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Helper – maps a warehouse status config to a <Badge>
// ---------------------------------------------------------------------------

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

interface StatusConfig {
  variant: BadgeVariant
  label: string
  className?: string
}

function StatusBadge({ config }: { config: StatusConfig }) {
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Colour palette helpers (optional fine-grained overrides)
// ---------------------------------------------------------------------------

const BG_GREEN =
  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400'
const BG_RED =
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400'
const BG_AMBER =
  'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
const BG_BLUE =
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
const BG_PURPLE =
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
const BG_SLATE =
  'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
const BG_CYAN =
  'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400'
const BG_GRAY =
  'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
const BG_ORANGE =
  'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
const BG_INDIGO =
  'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400'
const BG_ROSE =
  'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
const BG_TEAL =
  'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400'

// ---------------------------------------------------------------------------
// 1. ASN Status
// ---------------------------------------------------------------------------

const ASN_STATUS_CONFIG: Record<AsnStatus, StatusConfig> = {
  [AsnStatus.CREATED]: {
    variant: 'outline',
    label: 'Created',
    className: BG_SLATE,
  },
  [AsnStatus.IN_TRANSIT]: {
    variant: 'default',
    label: 'In Transit',
    className: BG_BLUE,
  },
  [AsnStatus.ARRIVED]: {
    variant: 'default',
    label: 'Arrived',
    className: BG_TEAL,
  },
  [AsnStatus.IN_RECEIVING]: {
    variant: 'default',
    label: 'In Receiving',
    className: BG_PURPLE,
  },
  [AsnStatus.PARTIALLY_RECEIVED]: {
    variant: 'default',
    label: 'Partially Received',
    className: BG_AMBER,
  },
  [AsnStatus.RECEIVED]: {
    variant: 'default',
    label: 'Received',
    className: BG_GREEN,
  },
  [AsnStatus.CLOSED]: {
    variant: 'secondary',
    label: 'Closed',
    className: BG_GRAY,
  },
  [AsnStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function AsnStatusBadge({ status }: { status: AsnStatus }) {
  const config = ASN_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 2. ASN Line Status
// ---------------------------------------------------------------------------

const ASN_LINE_STATUS_CONFIG: Record<AsnLineStatus, StatusConfig> = {
  [AsnLineStatus.OPEN]: {
    variant: 'outline',
    label: 'Open',
    className: BG_SLATE,
  },
  [AsnLineStatus.PARTIALLY_RECEIVED]: {
    variant: 'default',
    label: 'Partially Received',
    className: BG_AMBER,
  },
  [AsnLineStatus.RECEIVED]: {
    variant: 'default',
    label: 'Received',
    className: BG_GREEN,
  },
  [AsnLineStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function AsnLineStatusBadge({ status }: { status: AsnLineStatus }) {
  const config = ASN_LINE_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 3. GRN Line Status
// ---------------------------------------------------------------------------

const GRN_LINE_STATUS_CONFIG: Record<GrnLineStatus, StatusConfig> = {
  [GrnLineStatus.OPEN]: {
    variant: 'outline',
    label: 'Open',
    className: BG_SLATE,
  },
  [GrnLineStatus.RECEIVED]: {
    variant: 'default',
    label: 'Received',
    className: BG_GREEN,
  },
  [GrnLineStatus.INSPECTING]: {
    variant: 'default',
    label: 'Inspecting',
    className: BG_PURPLE,
  },
  [GrnLineStatus.INSPECTED]: {
    variant: 'default',
    label: 'Inspected',
    className: BG_BLUE,
  },
  [GrnLineStatus.PUTAWAY_PENDING]: {
    variant: 'default',
    label: 'Putaway Pending',
    className: BG_AMBER,
  },
  [GrnLineStatus.PUTAWAY_DONE]: {
    variant: 'default',
    label: 'Putaway Done',
    className: BG_GREEN,
  },
  [GrnLineStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function GrnLineStatusBadge({ status }: { status: GrnLineStatus }) {
  const config = GRN_LINE_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 4. Order (Sales Order) Status
// ---------------------------------------------------------------------------

const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  [OrderStatus.CREATED]: {
    variant: 'outline',
    label: 'Created',
    className: BG_SLATE,
  },
  [OrderStatus.VALIDATED]: {
    variant: 'default',
    label: 'Validated',
    className: BG_BLUE,
  },
  [OrderStatus.ALLOCATED]: {
    variant: 'default',
    label: 'Allocated',
    className: BG_PURPLE,
  },
  [OrderStatus.RELEASED]: {
    variant: 'default',
    label: 'Released',
    className: BG_AMBER,
  },
  [OrderStatus.PICKED]: {
    variant: 'default',
    label: 'Picked',
    className: BG_CYAN,
  },
  [OrderStatus.PACKED]: {
    variant: 'default',
    label: 'Packed',
    className: BG_INDIGO,
  },
  [OrderStatus.SHIPPED]: {
    variant: 'default',
    label: 'Shipped',
    className: BG_GREEN,
  },
  [OrderStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 5. Picking Task Status
// ---------------------------------------------------------------------------

const PICKING_TASK_STATUS_CONFIG: Record<PickingTaskStatus, StatusConfig> = {
  [PickingTaskStatus.CREATED]: {
    variant: 'outline',
    label: 'Created',
    className: BG_SLATE,
  },
  [PickingTaskStatus.AVAILABLE]: {
    variant: 'default',
    label: 'Available',
    className: BG_BLUE,
  },
  [PickingTaskStatus.ASSIGNED]: {
    variant: 'default',
    label: 'Assigned',
    className: BG_PURPLE,
  },
  [PickingTaskStatus.IN_PROGRESS]: {
    variant: 'default',
    label: 'In Progress',
    className: BG_CYAN,
  },
  [PickingTaskStatus.ON_HOLD]: {
    variant: 'secondary',
    label: 'On Hold',
    className: BG_GRAY,
  },
  [PickingTaskStatus.COMPLETED]: {
    variant: 'default',
    label: 'Completed',
    className: BG_GREEN,
  },
  [PickingTaskStatus.EXCEPTION]: {
    variant: 'default',
    label: 'Exception',
    className: BG_ROSE,
  },
  [PickingTaskStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function PickingTaskStatusBadge({
  status,
}: {
  status: PickingTaskStatus
}) {
  const config = PICKING_TASK_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 6. Cycle Count Status
// ---------------------------------------------------------------------------

const CYCLE_COUNT_STATUS_CONFIG: Record<CycleCountStatus, StatusConfig> = {
  [CycleCountStatus.PENDING]: {
    variant: 'outline',
    label: 'Pending',
    className: BG_AMBER,
  },
  [CycleCountStatus.IN_PROGRESS]: {
    variant: 'default',
    label: 'In Progress',
    className: BG_PURPLE,
  },
  [CycleCountStatus.COMPLETED]: {
    variant: 'default',
    label: 'Completed',
    className: BG_GREEN,
  },
  [CycleCountStatus.VARIANCE]: {
    variant: 'default',
    label: 'Variance',
    className: BG_ORANGE,
  },
  [CycleCountStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function CycleCountStatusBadge({
  status,
}: {
  status: CycleCountStatus
}) {
  const config = CYCLE_COUNT_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 7. QC Status
// ---------------------------------------------------------------------------

const QC_STATUS_CONFIG: Record<QcStatus, StatusConfig> = {
  [QcStatus.NOT_REQUIRED]: {
    variant: 'secondary',
    label: 'Not Required',
    className: BG_GRAY,
  },
  [QcStatus.PENDING]: {
    variant: 'outline',
    label: 'Pending',
    className: BG_AMBER,
  },
  [QcStatus.PASSED]: {
    variant: 'default',
    label: 'Passed',
    className: BG_GREEN,
  },
  [QcStatus.FAILED]: {
    variant: 'destructive',
    label: 'Failed',
    className: BG_RED,
  },
}

export function QcStatusBadge({ status }: { status: QcStatus }) {
  const config = QC_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 8. Variance Type
// ---------------------------------------------------------------------------

const VARIANCE_TYPE_CONFIG: Record<VarianceType, StatusConfig> = {
  [VarianceType.NONE]: {
    variant: 'secondary',
    label: 'None',
    className: BG_GRAY,
  },
  [VarianceType.DAMAGED]: {
    variant: 'destructive',
    label: 'Damaged',
    className: BG_RED,
  },
  [VarianceType.SHORT]: {
    variant: 'default',
    label: 'Short',
    className: BG_AMBER,
  },
  [VarianceType.OVER]: {
    variant: 'default',
    label: 'Over',
    className: BG_BLUE,
  },
}

export function VarianceTypeBadge({ status }: { status: VarianceType }) {
  const config = VARIANCE_TYPE_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 9. Wave Status (for Wave / Picking task boards)
// ---------------------------------------------------------------------------

const WAVE_STATUS_CONFIG: Record<WaveStatus, StatusConfig> = {
  [WaveStatus.PENDING]: {
    variant: 'outline',
    label: 'Pending',
    className: BG_AMBER,
  },
  [WaveStatus.ASSIGNED]: {
    variant: 'default',
    label: 'Assigned',
    className: BG_BLUE,
  },
  [WaveStatus.IN_PROGRESS]: {
    variant: 'default',
    label: 'In Progress',
    className: BG_PURPLE,
  },
  [WaveStatus.COMPLETED]: {
    variant: 'default',
    label: 'Completed',
    className: BG_GREEN,
  },
  [WaveStatus.ON_HOLD]: {
    variant: 'secondary',
    label: 'On Hold',
    className: BG_GRAY,
  },
}

export function WaveStatusBadge({ status }: { status: WaveStatus }) {
  const config = WAVE_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 10. Load Status
// ---------------------------------------------------------------------------

const LOAD_STATUS_CONFIG: Record<LoadStatus, StatusConfig> = {
  [LoadStatus.PLANNED]: {
    variant: 'outline',
    label: 'Planned',
    className: BG_SLATE,
  },
  [LoadStatus.LOADED]: {
    variant: 'default',
    label: 'Loaded',
    className: BG_BLUE,
  },
  [LoadStatus.DEPARTED]: {
    variant: 'secondary',
    label: 'Departed',
    className: BG_GRAY,
  },
  [LoadStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function LoadStatusBadge({ status }: { status: LoadStatus }) {
  const config = LOAD_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 11. LPN Status
// ---------------------------------------------------------------------------

const LPN_STATUS_CONFIG: Record<LpnStatus, StatusConfig> = {
  [LpnStatus.AVAILABLE]: {
    variant: 'default',
    label: 'Available',
    className: BG_GREEN,
  },
  [LpnStatus.RESERVED]: {
    variant: 'secondary',
    label: 'Reserved',
    className: BG_AMBER,
  },
  [LpnStatus.SHIPPED]: {
    variant: 'outline',
    label: 'Shipped',
    className: BG_GRAY,
  },
  [LpnStatus.DAMAGED]: {
    variant: 'destructive',
    label: 'Damaged',
    className: BG_RED,
  },
}

export function LpnStatusBadge({ status }: { status: LpnStatus }) {
  const config = LPN_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}

// ---------------------------------------------------------------------------
// 12. Purchase Order Status
// ---------------------------------------------------------------------------

const PO_STATUS_CONFIG: Record<PoStatus, StatusConfig> = {
  [PoStatus.OPEN]: { variant: 'default', label: 'Open', className: BG_BLUE },
  [PoStatus.CLOSED]: {
    variant: 'secondary',
    label: 'Closed',
    className: BG_GRAY,
  },
  [PoStatus.CANCELLED]: {
    variant: 'destructive',
    label: 'Cancelled',
    className: BG_RED,
  },
}

export function PoStatusBadge({ status }: { status: PoStatus }) {
  const config = PO_STATUS_CONFIG[status]
  if (!config) return <Badge variant='outline'>{status}</Badge>
  return <StatusBadge config={config} />
}
