import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/features/brands/data/brand-queries', () => ({
  useUpdateBrand: vi.fn(),
}))

import { EditBrandDialog } from '../edit-brand-dialog'
import { useUpdateBrand } from '@/features/brands/data/brand-queries'

const mockBrand = {
  brand_id: 1,
  brand_code: 'BRD-001',
  brand_name: 'Test Brand',
  description: 'Original description',
  is_active: true,
}

function setupDialog() {
  const mockMutate = vi.fn()
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()

  vi.mocked(useUpdateBrand).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as ReturnType<typeof useUpdateBrand>)

  return { mockMutate, onOpenChange, onSuccess }
}

describe('EditBrandDialog', () => {
  it('renders when open with pre-filled values', () => {
    const { onOpenChange } = setupDialog()
    render(
      <EditBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={mockBrand}
      />,
    )

    expect(screen.getByText('Edit Brand')).toBeInTheDocument()
    expect(screen.getByText(/Test Brand/)).toBeInTheDocument()

    const codeInput = screen.getByPlaceholderText('e.g. BRD-001') as HTMLInputElement
    expect(codeInput.value).toBe('BRD-001')

    const nameInput = screen.getByPlaceholderText('Brand name') as HTMLInputElement
    expect(nameInput.value).toBe('Test Brand')
  })

  it('does not render content when closed', () => {
    const { onOpenChange } = setupDialog()
    const { container } = render(
      <EditBrandDialog
        open={false}
        onOpenChange={onOpenChange}
        brand={mockBrand}
      />,
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('calls mutate with updated form data on submission', async () => {
    const user = userEvent.setup()
    const { mockMutate, onOpenChange } = setupDialog()

    render(
      <EditBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={mockBrand}
      />,
    )

    const codeInput = screen.getByPlaceholderText('e.g. BRD-001')
    await user.clear(codeInput)
    await user.type(codeInput, 'BRD-002')

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    const mutateArg = mockMutate.mock.calls[0][0]
    expect(mutateArg).toMatchObject({
      brand_id: 1,
      brand_code: 'BRD-002',
      brand_name: 'Test Brand',
      description: 'Original description',
      is_active: true,
    })
  })

  it('calls onSuccess and closes dialog when mutation succeeds', async () => {
    const user = userEvent.setup()
    const { mockMutate, onOpenChange, onSuccess } = setupDialog()

    mockMutate.mockImplementation((_data, options) => {
      options?.onSuccess?.()
    })

    render(
      <EditBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={mockBrand}
        onSuccess={onSuccess}
      />,
    )

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows loading state while submitting', () => {
    const { onOpenChange } = setupDialog()

    vi.mocked(useUpdateBrand).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as ReturnType<typeof useUpdateBrand>)

    render(
      <EditBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={mockBrand}
      />,
    )

    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).toBeDisabled()
  })

  it('does not submit with empty required fields', async () => {
    const user = userEvent.setup()
    const { mockMutate, onOpenChange } = setupDialog()

    render(
      <EditBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={{ ...mockBrand, brand_code: '' }}
      />,
    )

    const saveBtn = screen.getByRole('button', { name: /save/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    expect(mockMutate).not.toHaveBeenCalled()
  })
})
