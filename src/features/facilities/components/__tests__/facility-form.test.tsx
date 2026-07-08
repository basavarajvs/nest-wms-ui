import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FacilityForm } from '../facility-form'

function renderFacilityForm(props?: Partial<React.ComponentProps<typeof FacilityForm>>) {
  const onSubmit = vi.fn()
  const utils = render(
    <div>
      <FacilityForm onSubmit={onSubmit} {...props} />
      <button type='submit' form='facility-form'>
        Submit
      </button>
    </div>,
  )
  return { ...utils, onSubmit }
}

describe('FacilityForm', () => {
  it('renders all basic form fields', () => {
    renderFacilityForm()
    expect(screen.getByPlaceholderText('e.g. WH-001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Facility name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Facility description')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders required field labels', () => {
    renderFacilityForm()
    expect(screen.getByText('Code *')).toBeInTheDocument()
    expect(screen.getByText('Name *')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders section headings', () => {
    renderFacilityForm()
    expect(screen.getByText('Address')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
  })

  it('renders address fields', () => {
    renderFacilityForm()
    expect(screen.getByPlaceholderText('Street address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Apt, suite, etc.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('State')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ZIP code')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
  })

  it('renders contact fields', () => {
    renderFacilityForm()
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
  })

  it('sets default values correctly', () => {
    renderFacilityForm({
      defaultValues: {
        facility_code: 'WH-001',
        facility_name: 'Main Warehouse',
        description: 'A test warehouse',
        is_active: false,
      },
    })
    const codeInput = screen.getByPlaceholderText('e.g. WH-001') as HTMLInputElement
    expect(codeInput.value).toBe('WH-001')

    const nameInput = screen.getByPlaceholderText('Facility name') as HTMLInputElement
    expect(nameInput.value).toBe('Main Warehouse')

    const descInput = screen.getByPlaceholderText('Facility description') as HTMLTextAreaElement
    expect(descInput.value).toBe('A test warehouse')
  })

  it('shows required error when facility_code is empty on submit', async () => {
    const user = userEvent.setup()
    renderFacilityForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })
  })

  it('shows required error when facility_name is empty on submit', async () => {
    const user = userEvent.setup()
    renderFacilityForm({
      defaultValues: { facility_code: 'WH-001', facility_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows error when facility_code exceeds max length', async () => {
    const user = userEvent.setup()
    renderFacilityForm()

    const codeInput = screen.getByPlaceholderText('e.g. WH-001')
    await user.type(codeInput, 'A'.repeat(51))
    await user.tab()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/<=50/i)).toBeInTheDocument()
    })
  })

  it('does not call onSubmit with invalid email format', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm({
      defaultValues: { facility_code: 'WH-001', facility_name: 'Test WH' },
    })

    const emailInput = screen.getByPlaceholderText('Email address')
    await user.type(emailInput, 'not-an-email')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  it('clears error when field is filled after validation failure', async () => {
    const user = userEvent.setup()
    renderFacilityForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    const codeInput = screen.getByPlaceholderText('e.g. WH-001')
    await user.type(codeInput, 'WH-001')

    const nameInput = screen.getByPlaceholderText('Facility name')
    await user.type(nameInput, 'Test Facility')

    await waitFor(() => {
      expect(screen.queryByText('Code is required')).not.toBeInTheDocument()
    })
  })

  it('calls onSubmit with form values when valid', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm()

    await user.type(screen.getByPlaceholderText('e.g. WH-001'), 'WH-001')
    await user.type(screen.getByPlaceholderText('Facility name'), 'Main Warehouse')
    await user.type(screen.getByPlaceholderText('Facility description'), 'A test warehouse')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      facility_code: 'WH-001',
      facility_name: 'Main Warehouse',
      description: 'A test warehouse',
      is_active: true,
    })
  })

  it('calls onSubmit with default is_active when toggle not changed', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm()

    await user.type(screen.getByPlaceholderText('e.g. WH-001'), 'WH-002')
    await user.type(screen.getByPlaceholderText('Facility name'), 'Another WH')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({ is_active: true })
  })

  it('calls onSubmit with is_active false when toggled off', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm()

    await user.type(screen.getByPlaceholderText('e.g. WH-001'), 'WH-003')
    await user.type(screen.getByPlaceholderText('Facility name'), 'Inactive WH')

    const switchEl = screen.getByRole('switch')
    await user.click(switchEl)

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({ is_active: false })
  })

  it('does not call onSubmit when required fields are empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows multiple validation errors simultaneously', async () => {
    const user = userEvent.setup()
    renderFacilityForm({
      defaultValues: { facility_code: '', facility_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('accepts valid data with all optional fields filled', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderFacilityForm()

    await user.type(screen.getByPlaceholderText('e.g. WH-001'), 'WH-MAIN')
    await user.type(screen.getByPlaceholderText('Facility name'), 'Main Warehouse')
    await user.type(screen.getByPlaceholderText('Street address'), '123 Industrial Blvd')
    await user.type(screen.getByPlaceholderText('Apt, suite, etc.'), 'Suite 100')
    await user.type(screen.getByPlaceholderText('City'), 'Atlanta')
    await user.type(screen.getByPlaceholderText('State'), 'GA')
    await user.type(screen.getByPlaceholderText('ZIP code'), '30301')
    await user.type(screen.getByPlaceholderText('Name'), 'John Smith')
    await user.type(screen.getByPlaceholderText('Phone number'), '+1-555-0123')
    await user.type(screen.getByPlaceholderText('Email address'), 'john@example.com')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      facility_code: 'WH-MAIN',
      facility_name: 'Main Warehouse',
      address_line1: '123 Industrial Blvd',
      address_line2: 'Suite 100',
      city: 'Atlanta',
      state_province: 'GA',
      postal_code: '30301',
      contact_person: 'John Smith',
      contact_phone: '+1-555-0123',
      contact_email: 'john@example.com',
    })
  })
})
