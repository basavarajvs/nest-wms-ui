import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/product-brands/product-brands', () => ({
  BrandController_findAll: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/product-categories/product-categories', () => ({
  CategoryController_findAll: vi.fn(),
}))

vi.mock('@/lib/wms-api/api/wms-api/units-of-measure/units-of-measure', () => ({
  UomController_findAll: vi.fn(),
}))

import { CreateProductForm } from '../create-product-form'
import { BrandController_findAll } from '@/lib/wms-api/api/wms-api/product-brands/product-brands'
import { CategoryController_findAll } from '@/lib/wms-api/api/wms-api/product-categories/product-categories'
import { UomController_findAll } from '@/lib/wms-api/api/wms-api/units-of-measure/units-of-measure'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function renderProductForm(props?: Partial<React.ComponentProps<typeof CreateProductForm>>) {
  const onSubmit = vi.fn()
  const utils = render(
    <Wrapper>
      <CreateProductForm onSubmit={onSubmit} {...props} />
      <button type='submit' form='create-product-form'>
        Submit
      </button>
    </Wrapper>,
  )
  return { ...utils, onSubmit }
}

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('CreateProductForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(BrandController_findAll).mockResolvedValue({ success: true, data: [] })
    vi.mocked(CategoryController_findAll).mockResolvedValue({ success: true, data: { categories: [] } })
    vi.mocked(UomController_findAll).mockResolvedValue({ success: true, data: [] })
  })

  it('renders all basic form fields', async () => {
    renderProductForm()
    expect(screen.getByPlaceholderText('e.g. PROD-001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Product name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Product description')).toBeInTheDocument()
  })

  it('renders required field labels', () => {
    renderProductForm()
    expect(screen.getByText('Product Code *')).toBeInTheDocument()
    expect(screen.getByText('Product Name *')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('sets default values correctly', () => {
    renderProductForm({
      defaultValues: {
        product_code: 'PROD-001',
        product_name: 'Test Product',
        description: 'Test description',
      },
    })
    const codeInput = screen.getByPlaceholderText('e.g. PROD-001') as HTMLInputElement
    expect(codeInput.value).toBe('PROD-001')

    const nameInput = screen.getByPlaceholderText('Product name') as HTMLInputElement
    expect(nameInput.value).toBe('Test Product')
  })

  it('shows required error when product_code is empty on submit', async () => {
    const user = userEvent.setup()
    renderProductForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Product code is required')).toBeInTheDocument()
    })
  })

  it('shows required error when product_name is empty on submit', async () => {
    const user = userEvent.setup()
    renderProductForm({
      defaultValues: { product_code: 'PROD-001', product_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Product name is required')).toBeInTheDocument()
    })
  })

  it('shows error when product_code exceeds max length', async () => {
    const user = userEvent.setup()
    renderProductForm()

    const codeInput = screen.getByPlaceholderText('e.g. PROD-001')
    await user.type(codeInput, 'A'.repeat(51))
    await user.tab()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/at most 50/i)).toBeInTheDocument()
    })
  })

  it('clears error when field is filled after validation failure', async () => {
    const user = userEvent.setup()
    renderProductForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Product code is required')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('e.g. PROD-001'), 'PROD-001')
    await user.type(screen.getByPlaceholderText('Product name'), 'Test Product')

    await waitFor(() => {
      expect(
        screen.queryByText('Product code is required'),
      ).not.toBeInTheDocument()
    })
  })

  it('calls onSubmit with form values when valid', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderProductForm()

    await user.type(screen.getByPlaceholderText('e.g. PROD-001'), 'PROD-001')
    await user.type(screen.getByPlaceholderText('Product name'), 'Test Product')
    await user.type(
      screen.getByPlaceholderText('Product description'),
      'A test product',
    )

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit.mock.calls[0][0]).toEqual({
      product_code: 'PROD-001',
      product_name: 'Test Product',
      description: 'A test product',
      brand_id: '',
      category_id: '',
      primary_uom_id: '',
      is_active: true,
    })
  })

  it('calls onSubmit with default is_active value of true', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderProductForm()

    await user.type(screen.getByPlaceholderText('e.g. PROD-001'), 'PROD-002')
    await user.type(screen.getByPlaceholderText('Product name'), 'Another Product')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({ is_active: true })
  })

  it('does not call onSubmit when required fields are empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderProductForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Product code is required')).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows multiple validation errors simultaneously', async () => {
    const user = userEvent.setup()
    renderProductForm({
      defaultValues: { product_code: '', product_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Product code is required')).toBeInTheDocument()
      expect(screen.getByText('Product name is required')).toBeInTheDocument()
    })
  })

})
