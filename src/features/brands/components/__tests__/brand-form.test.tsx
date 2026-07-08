import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrandForm } from '../brand-form'

function renderBrandForm(props?: Partial<React.ComponentProps<typeof BrandForm>>) {
  const onSubmit = vi.fn()
  const utils = render(
    <div>
      <BrandForm onSubmit={onSubmit} {...props} />
      <button type='submit' form='brand-form'>
        Submit
      </button>
    </div>,
  )
  return { ...utils, onSubmit }
}

describe('BrandForm', () => {
  it('renders all form fields', () => {
    renderBrandForm()
    expect(screen.getByPlaceholderText('e.g. BRD-001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Brand name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Brand description')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders required field labels', () => {
    renderBrandForm()
    expect(screen.getByText('Code *')).toBeInTheDocument()
    expect(screen.getByText('Name *')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('sets default values correctly', () => {
    renderBrandForm({
      defaultValues: {
        brand_code: 'BRD-001',
        brand_name: 'Test Brand',
        description: 'A test description',
        is_active: false,
      },
    })
    const codeInput = screen.getByPlaceholderText('e.g. BRD-001') as HTMLInputElement
    expect(codeInput.value).toBe('BRD-001')

    const nameInput = screen.getByPlaceholderText('Brand name') as HTMLInputElement
    expect(nameInput.value).toBe('Test Brand')

    const descInput = screen.getByPlaceholderText('Brand description') as HTMLTextAreaElement
    expect(descInput.value).toBe('A test description')
  })

  it('shows required error when brand_code is empty on submit', async () => {
    const user = userEvent.setup()
    renderBrandForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })
  })

  it('shows required error when brand_name is empty on submit', async () => {
    const user = userEvent.setup()
    renderBrandForm({
      defaultValues: { brand_code: 'BRD-001', brand_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows error when brand_code exceeds max length', async () => {
    const user = userEvent.setup()
    renderBrandForm()

    const codeInput = screen.getByPlaceholderText('e.g. BRD-001')
    await user.type(codeInput, 'A'.repeat(51))
    await user.tab()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/<=50/i)).toBeInTheDocument()
    })
  })

  it('clears error when field is filled after validation', async () => {
    const user = userEvent.setup()
    renderBrandForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    const codeInput = screen.getByPlaceholderText('e.g. BRD-001')
    await user.type(codeInput, 'BRD-001')

    const nameInput = screen.getByPlaceholderText('Brand name')
    await user.type(nameInput, 'Test Brand')

    await waitFor(() => {
      expect(screen.queryByText('Code is required')).not.toBeInTheDocument()
    })
  })

  it('calls onSubmit with form values when valid', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderBrandForm()

    await user.type(screen.getByPlaceholderText('e.g. BRD-001'), 'BRD-001')
    await user.type(screen.getByPlaceholderText('Brand name'), 'Test Brand')
    await user.type(screen.getByPlaceholderText('Brand description'), 'A test description')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit.mock.calls[0][0]).toEqual({
      brand_code: 'BRD-001',
      brand_name: 'Test Brand',
      description: 'A test description',
      is_active: true,
    })
  })

  it('calls onSubmit with default is_active when toggle not changed', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderBrandForm()

    await user.type(screen.getByPlaceholderText('e.g. BRD-001'), 'BRD-002')
    await user.type(screen.getByPlaceholderText('Brand name'), 'Another Brand')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({ is_active: true })
  })

  it('calls onSubmit with is_active false when toggled off', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderBrandForm()

    await user.type(screen.getByPlaceholderText('e.g. BRD-001'), 'BRD-003')
    await user.type(screen.getByPlaceholderText('Brand name'), 'Inactive Brand')

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
    const { onSubmit } = renderBrandForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows multiple validation errors simultaneously', async () => {
    const user = userEvent.setup()
    renderBrandForm({
      defaultValues: { brand_code: '', brand_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

})
