import type { Page } from '@playwright/test'

const WMS_BASE = 'http://localhost:3002/api/v1/wms/web'
const AUTH_BASE = 'http://localhost:3000/api/v1/auth'

export const mockUser = {
  id: 'user-2',
  username: 'warehouse.manager',
  email: 'warehouse.manager@somemail.com',
  firstName: 'Warehouse',
  lastName: 'Manager',
  tenantId: '3',
  tenantCode: 'DE0001',
  tenantName: 'Demo Tenant',
  roles: ['WAREHOUSE_ADMIN', 'SYSTEM_ADMIN'],
  permissions: ['read', 'write', 'delete', 'manage'],
}

const initialMockVendors = [
  { vendor_id: 1, vendor_code: 'VEN-001', vendor_name: 'Acme Supplies', description: 'Primary hardware supplier', is_active: true },
  { vendor_id: 2, vendor_code: 'VEN-002', vendor_name: 'Global Logistics Co.', description: 'International shipping partner', is_active: true },
  { vendor_id: 3, vendor_code: 'VEN-003', vendor_name: 'Quality Parts Inc.', description: 'OEM components', is_active: false },
  { vendor_id: 4, vendor_code: 'VEN-004', vendor_name: 'Raw Materials Ltd.', description: '', is_active: true },
]

const initialMockAsns = [
  { asn_id: 1, asn_number: 'ASN-2024-0001', client_name: 'Acme Corp', vendor_name: 'Acme Supplies', po_number: 'PO-001', expected_arrival_date: '2024-12-15T00:00:00Z', status: 'CREATED', tracking_number: 'TRACK-001' },
  { asn_id: 2, asn_number: 'ASN-2024-0002', client_name: 'Beta Inc', vendor_name: 'Global Logistics Co.', po_number: 'PO-002', expected_arrival_date: '2024-12-20T00:00:00Z', status: 'IN_TRANSIT', tracking_number: 'TRACK-002' },
]

const initialMockOrders = [
  { order_id: 'ORD-001', order_number: 'ORD-2024-0001', customer_name: 'Acme Corp', order_date: '2024-12-01T00:00:00Z', status: 'NEW', total_lines: 3, priority: 1, total_order_quantity: 150, total_order_value: 12500.00, currency_code: 'USD' },
  { order_id: 'ORD-002', order_number: 'ORD-2024-0002', customer_name: 'Beta Inc', order_date: '2024-12-05T00:00:00Z', status: 'ALLOCATED', total_lines: 5, priority: 2, total_order_quantity: 300, total_order_value: 45000.00, currency_code: 'USD' },
]

const initialMockInventoryRecords = [
  { inventory_id: 1, product_name: 'Widget A', product_sku: 'WDG-A-001', lpn_code: 'LPN-001', location_name: 'A-01-B-01', lot_number: 'LOT-2024-001', quantity_on_hand: 500, quantity_allocated: 100, quantity_reserved: 0, quantity_picked: 0, quantity_on_hold: 0, quantity_damaged: 0, inbound_qty: 200, uom_name: 'EA', status: 'IN_STOCK', updated_at: '2024-12-10T00:00:00Z' },
  { inventory_id: 2, product_name: 'Widget B', product_sku: 'WDG-B-002', lpn_code: 'LPN-002', location_name: 'A-02-B-01', lot_number: 'LOT-2024-002', quantity_on_hand: 100, quantity_allocated: 100, quantity_reserved: 0, quantity_picked: 50, quantity_on_hold: 0, quantity_damaged: 0, inbound_qty: 0, uom_name: 'EA', status: 'ALLOCATED', updated_at: '2024-12-11T00:00:00Z' },
]

export const mockVendors = [...initialMockVendors]
export const mockAsns = [...initialMockAsns]
export const mockOrders = [...initialMockOrders]
export const mockInventoryRecords = [...initialMockInventoryRecords]

export function resetMockData() {
  mockVendors.length = 0
  mockVendors.push(...initialMockVendors)
  mockAsns.length = 0
  mockAsns.push(...initialMockAsns)
  mockOrders.length = 0
  mockOrders.push(...initialMockOrders)
  mockInventoryRecords.length = 0
  mockInventoryRecords.push(...initialMockInventoryRecords)
}

export async function setupAllMocks(page: Page) {
  resetMockData()
  await page.route(`${WMS_BASE}/**`, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { data: [], total: 0 } }) })
    } else if (method === 'POST' || method === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }
  })

  await page.route(`${AUTH_BASE}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname

    if (pathname.endsWith('/login')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { accessToken: 'mock-jwt-token', refreshToken: 'mock-refresh-token', user: mockUser },
        }),
      })
    } else if (pathname.endsWith('/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { accessToken: 'mock-refreshed-token', refreshToken: 'mock-refresh-token' } }),
      })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    }
  })

  await page.route(`${WMS_BASE}/vendors**`, async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname
    const method = route.request().method()
    const segments = pathname.split('/').filter(Boolean)
    const isById = segments.length >= 6

    if (isById) {
      const id = segments[segments.length - 1]
      if (method === 'GET') {
        const vendor = mockVendors.find((v) => String(v.vendor_id) === id)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: vendor || null }),
        })
      } else if (method === 'PUT' || method === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}')
        const idx = mockVendors.findIndex((v) => String(v.vendor_id) === id)
        if (idx >= 0) mockVendors[idx] = { ...mockVendors[idx], ...body }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: idx >= 0 ? mockVendors[idx] : null }),
        })
      } else if (method === 'DELETE') {
        const idx = mockVendors.findIndex((v) => String(v.vendor_id) === id)
        if (idx >= 0) mockVendors.splice(idx, 1)
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) })
      }
      return
    }

    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase()
      const pageNum = Number(url.searchParams.get('page')) || 1
      const limit = Number(url.searchParams.get('limit')) || 20
      let filtered = [...mockVendors]
      if (search) {
        filtered = filtered.filter((v) => v.vendor_code.toLowerCase().includes(search) || v.vendor_name.toLowerCase().includes(search))
      }
      const total = filtered.length
      const start = (pageNum - 1) * limit
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: filtered.slice(start, start + limit), total, page: pageNum, limit } }),
      })
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      const newVendor = { vendor_id: Date.now(), vendor_code: body.vendor_code, vendor_name: body.vendor_name, description: body.description || '', is_active: body.is_active ?? true }
      mockVendors.unshift(newVendor)
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: newVendor }) })
    }
  })

  await page.route(`${WMS_BASE}/advance-ship-notices**`, async (route) => {
    const url = new URL(route.request().url())
    const pathname = url.pathname
    const method = route.request().method()
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length >= 7 && method === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
      return
    }

    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase()
      const statusFilter = url.searchParams.get('status')
      let filtered = [...mockAsns]
      if (search) {
        filtered = filtered.filter((a) => a.asn_number.toLowerCase().includes(search) || a.po_number.toLowerCase().includes(search))
      }
      if (statusFilter) filtered = filtered.filter((a) => a.status === statusFilter)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: filtered, total: filtered.length, page: 1, limit: 20 } }),
      })
    } else if (method === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      const newAsn = { asn_id: Date.now(), asn_number: body.asn_number, client_name: 'Acme Corp', vendor_name: 'Acme Supplies', po_number: body.po_number, expected_arrival_date: body.expected_arrival_date, status: 'CREATED', tracking_number: body.tracking_number }
      mockAsns.unshift(newAsn)
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: newAsn }) })
    }
  })

  await page.route(`${WMS_BASE}/sales-orders**`, async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase()
      const statusFilter = url.searchParams.get('status')
      let filtered = [...mockOrders]
      if (search) {
        filtered = filtered.filter((o) => o.order_number.toLowerCase().includes(search) || o.customer_name.toLowerCase().includes(search))
      }
      if (statusFilter) filtered = filtered.filter((o) => o.status === statusFilter)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: filtered, total: filtered.length, page: 1, limit: 20 } }),
      })
    }
  })

  await page.route(`${WMS_BASE}/inventory/on-hand**`, async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    if (method === 'GET') {
      const search = url.searchParams.get('search')?.toLowerCase()
      const statusFilter = url.searchParams.get('status')
      let filtered = [...mockInventoryRecords]
      if (search) {
        filtered = filtered.filter((r) => r.product_name.toLowerCase().includes(search) || r.lot_number?.toLowerCase().includes(search))
      }
      if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: filtered, total: filtered.length, page: 1, limit: 20 } }),
      })
    }
  })

  await page.route(`${WMS_BASE}/products**`, async (route) => {
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url())
      const pageNum = Number(url.searchParams.get('page')) || 1
      const limit = Number(url.searchParams.get('limit')) || 10
      const products = [
        { product_id: 1, product_code: 'PRD-001', product_name: 'Widget A', product_sku: 'WDG-A-001', is_active: true },
        { product_id: 2, product_code: 'PRD-002', product_name: 'Widget B', product_sku: 'WDG-B-002', is_active: true },
      ]
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: products, total: products.length, page: pageNum, limit } }),
      })
    }
  })

  await page.route(`${WMS_BASE}/locations**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [{ location_id: 1, location_name: 'A-01-B-01', location_code: 'A-01-B-01' }] }),
      })
    }
  })

  await page.route(`${WMS_BASE}/clients**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: [{ client_id: 1, client_code: 'CLT-001', client_name: 'Acme Corp', is_active: true }], total: 1 } }),
      })
    }
  })

  await page.route(`${WMS_BASE}/units-of-measure**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [{ uom_id: 1, uom_code: 'EA', uom_name: 'Each', is_active: true }] }),
      })
    }
  })

  await page.route(`${WMS_BASE}/warehouse-facilities**`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { data: [{ facility_id: 1, facility_code: 'FAC-001', facility_name: 'Main Warehouse', is_active: true }], total: 1 } }),
      })
    }
  })

  await page.route(`${WMS_BASE}/picking-waves**`, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { data: [], total: 0, page: 1, limit: 20 } }) })
    } else if (method === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { wave_id: 1, wave_number: 'WAVE-2024-0001', status: 'CREATED' } }) })
    }
  })

}
