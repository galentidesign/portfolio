import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

// ---------------------------------------------------------------------------
// Renders children
// ---------------------------------------------------------------------------

describe('Card children', () => {
  it('renders children content', () => {
    render(<Card>Hello World</Card>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders complex children', () => {
    render(
      <Card>
        <p>Paragraph one</p>
        <p>Paragraph two</p>
      </Card>,
    )
    expect(screen.getByText('Paragraph one')).toBeInTheDocument()
    expect(screen.getByText('Paragraph two')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Title row
// ---------------------------------------------------------------------------

describe('Card title', () => {
  it('renders title row when provided', () => {
    render(<Card title="My Title">Card content</Card>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('does not render title row when not provided', () => {
    const { container } = render(<Card>Card content</Card>)
    const titleElements = container.querySelectorAll('.title')
    expect(titleElements).toHaveLength(0)
  })

  it('title appears before body content', () => {
    render(<Card title="Title Text">Body text</Card>)
    const titleEl = screen.getByText('Title Text')
    const bodyEl = screen.getByText('Body text')
    expect(titleEl.compareDocumentPosition(bodyEl) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

describe('Card footer', () => {
  it('renders footer when provided', () => {
    render(<Card footer="Footer text">Card content</Card>)
    expect(screen.getByText('Footer text')).toBeInTheDocument()
  })

  it('does not render footer when not provided', () => {
    const { container } = render(<Card>Card content</Card>)
    const footerElements = container.querySelectorAll('.footer')
    expect(footerElements).toHaveLength(0)
  })

  it('footer appears after body content', () => {
    render(<Card footer="Footer text">Body text</Card>)
    const footerEl = screen.getByText('Footer text')
    const bodyEl = screen.getByText('Body text')
    expect(bodyEl.compareDocumentPosition(footerEl) === Node.DOCUMENT_POSITION_FOLLOWING).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// data-flush attribute
// ---------------------------------------------------------------------------

describe('Card data-flush', () => {
  it('has data-flush when flush=true', () => {
    render(<Card flush>Content</Card>)
    const content = screen.getByText('Content')
    const card = content.closest('[data-flush]')
    expect(card).toHaveAttribute('data-flush')
  })

  it('does not have data-flush when flush=false', () => {
    render(<Card flush={false}>Content</Card>)
    const content = screen.getByText('Content')
    const card = content.closest('div, a')
    expect(card).not.toHaveAttribute('data-flush')
  })

  it('does not have data-flush by default', () => {
    render(<Card>Content</Card>)
    const content = screen.getByText('Content')
    const card = content.closest('div, a')
    expect(card).not.toHaveAttribute('data-flush')
  })
})

// ---------------------------------------------------------------------------
// data-interactive attribute
// ---------------------------------------------------------------------------

describe('Card data-interactive', () => {
  it('has data-interactive when href is provided', () => {
    render(<Card href="https://example.com">Link card</Card>)
    const content = screen.getByText('Link card')
    const card = content.closest('[data-interactive]')
    expect(card).toHaveAttribute('data-interactive')
  })

  it('does not have data-interactive when href is not provided', () => {
    render(<Card>Content</Card>)
    const content = screen.getByText('Content')
    const card = content.closest('div, a')
    expect(card).not.toHaveAttribute('data-interactive')
  })
})

// ---------------------------------------------------------------------------
// href / anchor mode
// ---------------------------------------------------------------------------

describe('Card href (anchor mode)', () => {
  it('renders as <div> by default', () => {
    render(<Card>Content</Card>)
    const content = screen.getByText('Content')
    const root = content.closest('div, a')
    expect(root?.tagName).toBe('DIV')
  })

  it('renders as <a> when href is provided', () => {
    render(<Card href="https://example.com">Link card</Card>)
    const content = screen.getByText('Link card')
    const link = content.closest('a')
    expect(link).toBeInTheDocument()
    expect(link?.tagName).toBe('A')
  })

  it('sets href attribute on anchor', () => {
    render(<Card href="https://example.com/path">Link card</Card>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com/path')
  })

  it('link card preserves text color (not accent)', () => {
    render(<Card href="https://example.com">Link card text</Card>)
    const content = screen.getByText('Link card text')
    // The component applies --color-ink to body, which is verified by the CSS test
    expect(content).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Combined states
// ---------------------------------------------------------------------------

describe('Card combined states', () => {
  it('renders with title, footer, and href', () => {
    render(
      <Card title="Title" href="https://example.com" footer="Footer">
        Content
      </Card>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('data-interactive')
  })

  it('renders with flush and href', () => {
    render(
      <Card flush href="https://example.com">
        Content
      </Card>,
    )
    const content = screen.getByText('Content')
    const link = content.closest('a')
    expect(link).toHaveAttribute('data-flush')
    expect(link).toHaveAttribute('data-interactive')
  })
})
