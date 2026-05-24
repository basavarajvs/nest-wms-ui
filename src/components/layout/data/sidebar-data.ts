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
          items: [
            { title: 'ASNs', url: '/inbound/asns' },
            { title: 'Goods Receipt', url: '/inbound/goods-receipt' },
            { title: 'Putaway Board', url: '/inbound/putaway-board' },
          ],
        },
        {
          title: 'Outbound',
          icon: ArrowUpFromLine,
          items: [
            { title: 'Sales Orders', url: '/outbound/orders' },
            { title: 'Allocations', url: '/outbound/allocations' },
            { title: 'Picking Waves', url: '/outbound/waves' },
            { title: 'Shipments', url: '/outbound/shipments' },
          ],
        },
        {
          title: 'Inventory',
          icon: Boxes,
          items: [
            { title: 'Stock Levels', url: '/inventory/stock' },
            { title: 'Low Stock Alerts', url: '/inventory/low-stock' },
            { title: 'Adjustments', url: '/inventory/adjustments' },
            { title: 'Holds', url: '/inventory/holds' },
            { title: 'Policies', url: '/inventory/policies' },
            { title: 'Transactions', url: '/inventory/transactions' },
          ],
        },
        {
          title: 'Transfers',
          url: '/transfers',
          icon: Repeat,
        },
        {
          title: 'Counts',
          icon: ClipboardCheck,
          items: [
            { title: 'Cycle Counts', url: '/counts/cycle' },
            { title: 'Schedule Counts', url: '/counts/schedule' },
          ],
        },
      ],
    },
    {
      title: 'Items',
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
      ],
    },
    {
      title: 'Warehouse',
      items: [
        {
          title: 'Facilities',
          icon: Building2,
          items: [
            { title: 'Facilities', url: '/warehouse/facilities' },
            { title: 'Zones', url: '/warehouse/zones' },
            { title: 'Locations', url: '/warehouse/locations' },
          ],
        },
      ],
    },
    {
      title: 'Reports',
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
        },
        {
          title: 'Settings',
          url: '/admin/settings',
          icon: Settings,
        },
        {
          title: 'Approvals',
          url: '/admin/approvals',
          icon: ShieldCheck,
        },
        {
          title: 'Notification Logs',
          url: '/admin/notifications',
          icon: Bell,
        },
        {
          title: 'Customization',
          url: '/admin/customization',
          icon: FileText,
        },
      ],
    },
  ],
}
