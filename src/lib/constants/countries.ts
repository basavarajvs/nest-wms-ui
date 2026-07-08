export const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'CN', label: 'China' },
  { value: 'SG', label: 'Singapore' },
  { value: 'JP', label: 'Japan' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'QA', label: 'Qatar' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'OM', label: 'Oman' },
  { value: 'IL', label: 'Israel' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'EG', label: 'Egypt' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KE', label: 'Kenya' },
  { value: 'GH', label: 'Ghana' },
  { value: 'MA', label: 'Morocco' },
  { value: 'ET', label: 'Ethiopia' },
] as const

export type Country = (typeof COUNTRY_OPTIONS)[number]['value']

export const COUNTRY_LABELS: Record<Country, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<Country, string>
