import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

// ---------------------------------------------------------------------------
// Variant / size data-attrs
// ---------------------------------------------------------------------------

describe('Button data-attrs', () => {
  it('defaults to variant=primary and size=md', () => {
    render(<Button>Click</Button>)
    const btn = screen.getByRole('button', { name: 'Click' })
    expect(btn).toHaveAttribute('data-variant', 'primary')
    expect(btn).toHaveAttribute('data-size', 'md')
  })

  it.each(['primary', 'secondary', 'ghost'] as const)('applies data-variant=%s', (variant) => {
    render(<Button variant={variant}>Click</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant)
  })

  it.each(['sm', 'md'] as const)('applies data-size=%s', (size) => {
    render(<Button size={size}>Click</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', size)
  })
})

// ---------------------------------------------------------------------------
// Default type
// ---------------------------------------------------------------------------

describe('Button type', () => {
  it('defaults to type="button"', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('respects type="submit"', () => {
    render(<Button type="submit">Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})

// ---------------------------------------------------------------------------
// Click fires onClick
// ---------------------------------------------------------------------------

describe('Button onClick', () => {
  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Busy state
// ---------------------------------------------------------------------------

describe('Button busy', () => {
  it('sets aria-busy="true" when busy', () => {
    render(<Button busy>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('sets data-busy when busy', () => {
    render(<Button busy>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-busy')
  })

  it('suppresses onClick when busy', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button busy onClick={handleClick}>
        Save
      </Button>,
    )
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('remains focusable (not disabled) when busy', () => {
    render(<Button busy>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).not.toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('Button disabled', () => {
  it('is disabled and blocks clicks', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(handleClick).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// href / anchor mode
// ---------------------------------------------------------------------------

describe('Button href (anchor mode)', () => {
  it('renders an <a> tag when href is provided', () => {
    render(<Button href="https://example.com">Go</Button>)
    const anchor = screen.getByRole('link', { name: 'Go' })
    expect(anchor.tagName).toBe('A')
    expect(anchor).toHaveAttribute('href', 'https://example.com')
  })

  it('disabled anchor keeps the link role with aria-disabled="true" and tabIndex=-1', () => {
    render(
      <Button href="https://example.com" disabled>
        Go
      </Button>,
    )
    // href is dropped when disabled; the explicit role keeps it a (disabled) link.
    const anchor = screen.getByRole('link', { name: 'Go' })
    expect(anchor).not.toHaveAttribute('href')
    expect(anchor).toHaveAttribute('aria-disabled', 'true')
    expect(anchor).toHaveAttribute('tabindex', '-1')
  })

  it('disabled anchor prevents click', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Button href="https://example.com" disabled onClick={handleClick}>
        Go
      </Button>,
    )
    const anchor = screen.getByText('Go').closest('a')!
    await user.click(anchor)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('enabled anchor fires onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
    render(
      <Button href="https://example.com" onClick={handleClick}>
        Go
      </Button>,
    )
    await user.click(screen.getByRole('link', { name: 'Go' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Keyboard activation (button mode)
// ---------------------------------------------------------------------------

describe('Button keyboard', () => {
  it('activates with Enter key', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    const btn = screen.getByRole('button')
    btn.focus()
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('activates with Space key', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    const btn = screen.getByRole('button')
    btn.focus()
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
