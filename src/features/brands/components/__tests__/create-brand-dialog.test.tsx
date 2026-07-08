import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/features/brands/data/brand-queries', () => ({
  useCreateBrand: vi.fn(),
}))

import { CreateBrandDialog } from '../create-brand-dialog'
import { useCreateBrand } from '@/features/brands/data/brand-queries'

function setupDialog() {
  const mockMutate = vi.fn()
  const onOpenChange = vi.fn()
  const onSuccess = vi.fn()

  vi.mocked(useCreateBrand).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as ReturnType<typeof useCreateBrand>)

  return { mockMutate, onOpenChange, onSuccess }
}

describe('CreateBrandDialog', () => {
  it('renders when open', () => {
    const { onOpenChange } = setupDialog()
    render(
      <CreateBrandDialog
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    expect(screen.getByText('Create Brand')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. BRD-001')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    const { onOpenChange } = setupDialog()
    const { container } = render(
      <CreateBrandDialog
        open={false}
        onOpenChange={onOpenChange}
      />,
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('calls mutate with form data on submission', async () => {
    const user = userEvent.setup()
    const { mockMutate, onOpenChange } = setupDialog()

    render(
      <CreateBrandDialog
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    await user.type(screen.getByPlaceholderText('e.g. BRD-001'), 'BRD-001')
    await user.type(screen.getByPlaceholderText('Brand name'), 'Test Brand')
    await user.type(screen.getByPlaceholderText('Brand description'), 'A test brand')

    const createBtn = screen.getByRole('button', { name: /create/i })
    await user.click(createBtn)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    const mutateArg = mockMutate.mock.calls[0][0]
    expect(mutateArg).toMatchObject({
      brand_code: 'BRD-001',
      brand_name: 'Test Brand',
      description: 'A test brand',
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
      <CreateBrandDialog
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
    )

    await user.type(screen.getByPlaceholderText('e.g. BRD-001'), 'BRD-001')
    await user.type(screen.getByPlaceholderText('Brand name'), 'Test Brand')

    const createBtn = screen.getByRole('button', { name: /create/i })
    await user.click(createBtn)

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows loading state while submitting', () => {
    const { onOpenChange } = setupDialog()

    vi.mocked(useCreateBrand).mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    } as ReturnType<typeof useCreateBrand>)

    render(
      <CreateBrandDialog
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    const createBtn = screen.getByRole('button', { name: /create/i })
    expect(createBtn).toBeDisabled()
  })

  it('does not submit when form validation fails', async () => {
    const user = userEvent.setup()
    const { mockMutate, onOpenChange } = setupDialog()

    render(
      <CreateBrandDialog
        open={true}
        onOpenChange={onOpenChange}
      />,
    )

    const createBtn = screen.getByRole('button', { name: /create/i })
    await user.click(createBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    expect(mockMutate).not.toHaveBeenCalled()
  })
})
