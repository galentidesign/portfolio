import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

// ---------------------------------------------------------------------------
// Title rendering
// ---------------------------------------------------------------------------

describe('EmptyState title', () => {
  it('renders the title', () => {
    render(<EmptyState title="No results found" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Description conditional rendering
// ---------------------------------------------------------------------------

describe('EmptyState description', () => {
  it('renders description when provided', () => {
    render(<EmptyState title="No results" description="Try adjusting your search terms" />)
    expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="No results" />)
    const descriptions = container.querySelectorAll('p')
    /* only one p: the title */
    expect(descriptions.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Icon wrapper aria-hidden
// ---------------------------------------------------------------------------

describe('EmptyState icon', () => {
  it('renders icon when provided', () => {
    render(<EmptyState title="No items" icon={<span data-testid="test-icon">◌</span>} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('wraps icon in aria-hidden', () => {
    const { container } = render(
      <EmptyState title="No items" icon={<span data-testid="test-icon">◌</span>} />,
    )
    const iconWrapper = container.querySelector('[aria-hidden="true"]')
    expect(iconWrapper).toBeInTheDocument()
    expect(iconWrapper).toContainElement(screen.getByTestId('test-icon'))
  })

  it('does not render icon when not provided', () => {
    const { container } = render(<EmptyState title="No items" />)
    const iconWrappers = container.querySelectorAll('[aria-hidden="true"]')
    expect(iconWrappers.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Action slot rendering
// ---------------------------------------------------------------------------

describe('EmptyState action', () => {
  it('renders action when provided', () => {
    render(
      <EmptyState
        title="No items"
        action={<button data-testid="action-btn">Create item</button>}
      />,
    )
    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
  })

  it('does not render action wrapper when not provided', () => {
    const { container } = render(<EmptyState title="No items" />)
    const actionWrappers = container.querySelectorAll('[class*="action"]')
    expect(actionWrappers.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// No heading element
// ---------------------------------------------------------------------------

describe('EmptyState heading', () => {
  it('does not render a heading element', () => {
    render(
      <EmptyState
        title="No results"
        description="Try again"
        icon={<span>◌</span>}
        action={<button>Action</button>}
      />,
    )
    const heading = screen.queryByRole('heading')
    expect(heading).toBeNull()
  })
})
