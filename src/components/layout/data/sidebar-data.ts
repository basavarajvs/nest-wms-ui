import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Repeat,
  ClipboardCheck,
  Package,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  Bell,
  FileText,
  Building2,
  Command,
  Briefcase,
  Truck,
  Tag,
  Warehouse,
  StickyNote,
  AlertTriangle,
  Ban,
  Layers,
  Container,
  Dock,
  PackagePlus,
  ShoppingCart,
  RotateCcw,
  QrCode,
  FileSpreadsheet,
  Printer,
  Wrench,
  DollarSign,
  Settings2,
  ScrollText,
  History,
} from 'lucide-react'
import type { SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Nest WMS',
      logo: Command,
      plan: 'Warehouse Management',
    },
  ],
  navGroups: [
    {
      title: 'Overview',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          title: 'Inbound',
          icon: ArrowDownToLine,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
          items: [
            { title: 'ASNs', url: '/inbound/asns', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Goods Receipt', url: '/inbound/goods-receipt', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Putaway Board', url: '/inbound/putaway-board', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Purchase Orders', url: '/inbound/purchase-orders', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Customer Returns', url: '/inbound/customer-returns', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Quality Dashboard', url: '/inbound/quality', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
          ],
        },
        {
          title: 'Outbound',
          icon: ArrowUpFromLine,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
          items: [
            { title: 'Sales Orders', url: '/outbound/orders', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Allocations', url: '/outbound/allocations', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Picking Waves', url: '/outbound/waves', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Shipments', url: '/outbound/shipments', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Loads', url: '/outbound/loads', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Shipping Labels', url: '/outbound/shipping-labels', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'VAS Execution', url: '/outbound/vas-execution', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Carrier Rates', url: '/outbound/carrier-rates', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
          ],
        },
        {
          title: 'Inventory',
          icon: Boxes,
          items: [
            { title: 'Stock Levels', url: '/inventory/stock', roles: ['WAREHOUSE_USER', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Low Stock Alerts', url: '/inventory/low-stock', roles: ['WAREHOUSE_USER', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Adjustments', url: '/inventory/adjustments', roles: ['WAREHOUSE_USER', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Holds', url: '/inventory/holds', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Policies', url: '/inventory/policies', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Transactions', url: '/inventory/transactions', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Reservations', url: '/inventory/reservations', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Exceptions', url: '/inventory/exceptions', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'NCRs', url: '/inventory/ncr', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
          ],
        },
        {
          title: 'Transfers',
          url: '/transfers',
          icon: Repeat,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Counts',
          icon: ClipboardCheck,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
          items: [
            { title: 'Cycle Counts', url: '/counts/cycle', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Schedule Counts', url: '/counts/schedule', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
          ],
        },
      ],
    },
    {
      title: 'Items',
      roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
      items: [
        {
          title: 'Products',
          url: '/items/products',
          icon: Package,
        },
        {
          title: 'Categories',
          url: '/items/categories',
        },
        {
          title: 'Brands',
          url: '/brands',
        },
        {
          title: 'Product Packaging',
          url: '/items/product-packaging',
        },
        {
          title: 'Product Suppliers',
          url: '/items/product-suppliers',
        },
        {
          title: 'Product-Client Assignments',
          url: '/items/product-client-assignments',
        },
      ],
    },
    {
      title: 'Warehouse',
      items: [
        {
          title: 'Facilities',
          icon: Building2,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER', 'TENANT_ADMIN'],
          items: [
            { title: 'Facilities', url: '/warehouse/facilities', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER', 'TENANT_ADMIN'] },
            { title: 'Zones', url: '/warehouse/zones', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Locations', url: '/warehouse/locations', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Packing Stations', url: '/warehouse/packing-stations', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Loading Docks', url: '/warehouse/loading-docks', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Setup', url: '/warehouse/setup', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Aisles', url: '/warehouse/aisles', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Bays', url: '/warehouse/bays', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Racks', url: '/warehouse/racks', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
            { title: 'Levels', url: '/warehouse/levels', roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'] },
          ],
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          title: 'Clients',
          url: '/clients',
          icon: Briefcase,
          roles: ['TENANT_ADMIN', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Vendors',
          url: '/vendors',
          icon: Truck,
          roles: ['TENANT_ADMIN', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Carriers',
          url: '/carriers',
          icon: Truck,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'LPNs',
          url: '/lpns',
          icon: QrCode,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'LPN Inquiry',
          url: '/lpn-inquiry',
          icon: QrCode,
          roles: ['WAREHOUSE_USER', 'WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Replenishment',
          url: '/replenishment',
          icon: RotateCcw,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
      ],
    },
    {
      title: 'Reports',
      roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
      items: [
        {
          title: 'Reports',
          url: '/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Admin',
      items: [
        {
          title: 'Users',
          url: '/admin/users',
          icon: Users,
          roles: ['TENANT_ADMIN'],
        },
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: Settings,
          roles: ['TENANT_ADMIN'],
        },
        {
          title: 'Approvals',
          url: '/admin/approvals',
          icon: ShieldCheck,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Notification Logs',
          url: '/admin/notifications',
          icon: Bell,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER', 'TENANT_ADMIN'],
        },
        {
          title: 'Business Rules',
          url: '/admin/rules',
          icon: ScrollText,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER'],
        },
        {
          title: 'Customization',
          url: '/admin/customization',
          icon: FileText,
          roles: ['WAREHOUSE_ADMIN', 'WAREHOUSE_MANAGER', 'TENANT_ADMIN'],
        },
        {
          title: 'Audit Logs',
          url: '/admin/audit-logs',
          icon: History,
          roles: ['TENANT_ADMIN'],
        },
        {
          title: 'Business Rules',
          url: '/admin/rules',
          icon: ScrollText,
          roles: ['WAREHOUSE_ADMIN'],
        },
        {
          title: 'Customization',
          url: '/admin/customization',
          icon: FileText,
          roles: ['WAREHOUSE_ADMIN', 'TENANT_ADMIN'],
        },
      ],
    },
  ],
}
