export const FACILITY_TYPE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'DISTRIBUTION_CENTER', label: 'Distribution Center' },
  { value: 'MANUFACTURING_PLANT', label: 'Manufacturing Plant' },
  { value: 'RETAIL_STORE', label: 'Retail Store' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'COLD_STORAGE', label: 'Cold Storage' },
  { value: 'HAZMAT_FACILITY', label: 'Hazmat Facility' },
  { value: 'CROSS_DOCK', label: 'Cross Dock' },
  { value: 'FULFILLMENT_CENTER', label: 'Fulfillment Center' },
  { value: 'STORAGE_FACILITY', label: 'Storage Facility' },
] as const

export type FacilityType = (typeof FACILITY_TYPE_OPTIONS)[number]['value']

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = Object.fromEntries(
  FACILITY_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<FacilityType, string>
