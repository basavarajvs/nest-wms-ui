import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Cog,
  FileText,
  HardHat,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  PackageOpen,
  Receipt,
  Ruler,
  Tag,
  Truck,
  Warehouse,
  Wrench,
} from 'lucide-react'

export type NavBadge = 'new' | 'soon'

export interface NavSubItem {
  id: string
  title: string
  url: string
  icon?: LucideIcon
  badge?: NavBadge
  disabled?: boolean
  roles?: string[]
}

export interface NavMainLinkItem {
  id: string
  title: string
  url: string
  icon?: LucideIcon
  badge?: NavBadge
  disabled?: boolean
  roles?: string[]
  subItems?: never
}

export interface NavMainParentItem {
  id: string
  title: string
  icon?: LucideIcon
  badge?: NavBadge
  disabled?: boolean
  roles?: string[]
  subItems: NavSubItem[]
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem

export interface NavGroup {
  id: number
  label?: string
  items: NavMainItem[]
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: 'Operations',
    items: [
      {
        id: 'inbound',
        title: 'Inbound',
        icon: PackageOpen,
        subItems: [
          { id: 'inbound-asns', title: 'ASNs', url: '/inbound/asns' },
          {
            id: 'inbound-receive-asn',
            title: 'Receive ASN',
            url: '/inbound/receive-asn',
          },
          { id: 'inbound-grns', title: 'GRNs', url: '/inbound/grns' },
          {
            id: 'inbound-receiving',
            title: 'Receiving',
            url: '/inbound/receiving',
            badge: 'soon',
          },
          { id: 'inbound-putaway', title: 'Putaway', url: '/inbound/putaway' },
        ],
      },
      {
        id: 'inventory',
        title: 'Inventory',
        icon: Archive,
        subItems: [
          {
            id: 'inventory-on-hand',
            title: 'On Hand Inquiry',
            url: '/inventory/on-hand',
          },
          {
            id: 'inventory-adjustments',
            title: 'Adjustments',
            url: '/inventory/adjustments',
          },
          {
            id: 'inventory-cycle-count',
            title: 'Cycle Counts',
            url: '/inventory/cycle-counts',
          },
          { id: 'inventory-lpn', title: 'LPN Lookup', url: '/inventory/lpn' },
        ],
      },
      {
        id: 'outbound',
        title: 'Outbound',
        icon: PackageCheck,
        subItems: [
          {
            id: 'outbound-orders',
            title: 'Sales Orders',
            url: '/outbound/sales-orders',
          },
          { id: 'outbound-waves', title: 'Waves', url: '/outbound/waves' },
          {
            id: 'outbound-picking',
            title: 'Picking',
            url: '/outbound/picking',
          },
          {
            id: 'outbound-packing',
            title: 'Packing',
            url: '/outbound/packing',
          },
          {
            id: 'outbound-staging',
            title: 'Staging',
            url: '/outbound/staging',
          },
          {
            id: 'outbound-shipping',
            title: 'Shipping',
            url: '/outbound/shipping',
          },
        ],
      },
      {
        id: 'quality',
        title: 'Quality',
        url: '/quality/inspections',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    id: 3,
    label: 'Master Data',
    items: [
      {
        id: 'master-data',
        title: 'Master Data',
        icon: Boxes,
        subItems: [
          {
            id: 'md-products',
            title: 'Products',
            url: '/master-data/products',
          },
          {
            id: 'md-categories',
            title: 'Categories',
            url: '/master-data/categories',
          },
          {
            id: 'md-brands',
            title: 'Brands',
            url: '/master-data/brands',
          },
          {
            id: 'md-uoms',
            title: 'Units of Measure',
            url: '/master-data/uoms',
          },
          {
            id: 'md-clients',
            title: 'Clients',
            url: '/master-data/clients',
          },
          {
            id: 'md-vendors',
            title: 'Vendors',
            url: '/master-data/vendors',
          },
          {
            id: 'md-carriers',
            title: 'Carriers',
            url: '/master-data/carriers',
          },
        ],
      },
      {
        id: 'warehouse',
        title: 'Warehouse',
        icon: Warehouse,
        subItems: [
          {
            id: 'wh-facilities',
            title: 'Facilities',
            url: '/warehouse/facilities',
          },
          { id: 'wh-zones', title: 'Zones', url: '/warehouse/zones' },
          {
            id: 'wh-locations',
            title: 'Locations',
            url: '/warehouse/locations',
          },
        ],
      },
    ],
  },
  {
    id: 4,
    label: 'Management',
    items: [
      {
        id: 'labor',
        title: 'Labor',
        icon: HardHat,
        subItems: [
          { id: 'labor-shifts', title: 'Shifts', url: '/labor/shifts' },
          {
            id: 'labor-time',
            title: 'Time Tracking',
            url: '/labor/time-tracking',
          },
        ],
      },
      {
        id: 'equipment',
        title: 'Equipment',
        url: '/equipment',
        icon: Wrench,
      },
      {
        id: 'dock-yard',
        title: 'Dock Yard',
        url: '/dock-yard/appointments',
        icon: Truck,
      },
      {
        id: 'exceptions',
        title: 'Exceptions',
        url: '/exceptions',
        icon: MapPin,
      },
      {
        id: 'billing',
        title: 'Billing',
        url: '/billing/invoices',
        icon: Receipt,
      },
    ],
  },
  {
    id: 5,
    label: 'Analytics',
    items: [
      {
        id: 'analytics',
        title: 'Analytics',
        url: '/analytics/dashboard',
        icon: BarChart3,
      },
      {
        id: 'reports',
        title: 'Reports',
        url: '/reports',
        icon: FileText,
      },
    ],
  },
  {
    id: 6,
    label: 'System',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        url: '/settings',
        icon: Cog,
      },
    ],
  },
]
