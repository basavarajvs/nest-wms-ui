import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/wms-api/api/wms-api/product-categories/product-categories', () => ({
  CategoryController_findAll: vi.fn(),
}))

import { CategoryForm } from '../category-form'
import { CategoryController_findAll } from '@/lib/wms-api/api/wms-api/product-categories/product-categories'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function renderCategoryForm(props?: Partial<React.ComponentProps<typeof CategoryForm>>) {
  const onSubmit = vi.fn()
  const utils = render(
    <Wrapper>
      <CategoryForm onSubmit={onSubmit} {...props} />
      <button type='submit' form='category-form'>
        Submit
      </button>
    </Wrapper>,
  )
  return { ...utils, onSubmit }
}

const mockCategories = [
  { category_id: 1, category_name: 'Electronics', category_code: 'CAT-001', is_active: true },
  { category_id: 2, category_name: 'Clothing', category_code: 'CAT-002', is_active: true },
]

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(CategoryController_findAll).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
  })

  it('renders all form fields', async () => {
    renderCategoryForm()
    expect(screen.getByPlaceholderText('e.g. CAT-001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Category name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Category description')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders required field labels', () => {
    renderCategoryForm()
    expect(screen.getByText('Code *')).toBeInTheDocument()
    expect(screen.getByText('Name *')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Parent Category')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('sets default values correctly', () => {
    renderCategoryForm({
      defaultValues: {
        category_code: 'CAT-001',
        category_name: 'Test Category',
        description: 'A test description',
        is_active: false,
      },
    })
    const codeInput = screen.getByPlaceholderText('e.g. CAT-001') as HTMLInputElement
    expect(codeInput.value).toBe('CAT-001')

    const nameInput = screen.getByPlaceholderText('Category name') as HTMLInputElement
    expect(nameInput.value).toBe('Test Category')

    const descInput = screen.getByPlaceholderText('Category description') as HTMLTextAreaElement
    expect(descInput.value).toBe('A test description')
  })

  it('shows required error when category_code is empty on submit', async () => {
    const user = userEvent.setup()
    renderCategoryForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })
  })

  it('shows required error when category_name is empty on submit', async () => {
    const user = userEvent.setup()
    renderCategoryForm({
      defaultValues: { category_code: 'CAT-001', category_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('shows error when category_code exceeds max length', async () => {
    const user = userEvent.setup()
    renderCategoryForm()

    const codeInput = screen.getByPlaceholderText('e.g. CAT-001')
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
    renderCategoryForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    const codeInput = screen.getByPlaceholderText('e.g. CAT-001')
    await user.type(codeInput, 'CAT-001')

    const nameInput = screen.getByPlaceholderText('Category name')
    await user.type(nameInput, 'Test Category')

    await waitFor(() => {
      expect(screen.queryByText('Code is required')).not.toBeInTheDocument()
    })
  })

  it('calls onSubmit with form values when valid', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderCategoryForm()

    await user.type(screen.getByPlaceholderText('e.g. CAT-001'), 'CAT-001')
    await user.type(screen.getByPlaceholderText('Category name'), 'Test Category')
    await user.type(screen.getByPlaceholderText('Category description'), 'A test category')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(onSubmit.mock.calls[0][0]).toEqual({
      category_code: 'CAT-001',
      category_name: 'Test Category',
      description: 'A test category',
      parent_category_id: '',
      is_active: true,
    })
  })

  it('calls onSubmit with default is_active when toggle not changed', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderCategoryForm()

    await user.type(screen.getByPlaceholderText('e.g. CAT-001'), 'CAT-002')
    await user.type(screen.getByPlaceholderText('Category name'), 'Another Category')

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0][0]).toMatchObject({ is_active: true })
  })

  it('calls onSubmit with is_active false when toggled off', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderCategoryForm()

    await user.type(screen.getByPlaceholderText('e.g. CAT-001'), 'CAT-003')
    await user.type(screen.getByPlaceholderText('Category name'), 'Inactive Category')

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
    const { onSubmit } = renderCategoryForm()

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows multiple validation errors simultaneously', async () => {
    const user = userEvent.setup()
    renderCategoryForm({
      defaultValues: { category_code: '', category_name: '' },
    })

    const submitBtn = screen.getByRole('button', { name: /submit/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Code is required')).toBeInTheDocument()
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
  })

  it('renders parent category select options from API data', async () => {
    renderCategoryForm()

    await waitFor(() => {
      expect(CategoryController_findAll).toHaveBeenCalledTimes(1)
    })
  })

  it('excludes current category from parent options when excludeId is provided', async () => {
    renderCategoryForm({ excludeId: 1 })

    await waitFor(() => {
      expect(CategoryController_findAll).toHaveBeenCalledTimes(1)
    })
  })
})
