import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

// ---------------------------------------------------------------------------
// Variant / size data-attrs
// ---------------------------------------------------------------------------

describe('Badge data-attrs', () => {
  it('defaults to tone=neutral and size=md', () => {
    render(<Badge>Label</Badge>)
    const badge = screen.getByText('Label')
    expect(badge).toHaveAttribute('data-tone', 'neutral')
    expect(badge).toHaveAttribute('data-size', 'md')
  })

  it.each(['neutral', 'accent', 'positive', 'caution', 'critical'] as const)(
    'applies data-tone=%s',
    (tone) => {
      render(<Badge tone={tone}>Label</Badge>)
      expect(screen.getByText('Label')).toHaveAttribute('data-tone', tone)
    },
  )

  it.each(['sm', 'md'] as const)('applies data-size=%s', (size) => {
    render(<Badge size={size}>Label</Badge>)
    expect(screen.getByText('Label')).toHaveAttribute('data-size', size)
  })
})

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

describe('Badge children', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('renders complex children', () => {
    render(
      <Badge>
        <span>Complex</span> content
      </Badge>,
    )
    expect(screen.getByText('Complex')).toBeInTheDocument()
    expect(screen.getByText(/content/)).toBeInTheDocument()
  })
})
