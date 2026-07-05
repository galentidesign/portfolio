import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CodeBlock } from './CodeBlock'

// ---------------------------------------------------------------------------
// Code rendering
// ---------------------------------------------------------------------------

describe('CodeBlock code rendering', () => {
  it('renders code text inside pre>code', () => {
    const testCode = 'const x = 1;'
    render(<CodeBlock code={testCode} />)
    const codeEl = screen.getByText(testCode)
    expect(codeEl.tagName).toBe('CODE')
    expect(codeEl.parentElement?.tagName).toBe('PRE')
  })

  it('renders code verbatim without modification', () => {
    const testCode = 'function foo() {\n  return 42\n}'
    render(<CodeBlock code={testCode} />)
    const codeEl = screen.getByRole('group').querySelector('code')
    expect(codeEl?.textContent).toBe(testCode)
  })
})

// ---------------------------------------------------------------------------
// Pre element accessibility
// ---------------------------------------------------------------------------

describe('CodeBlock pre element', () => {
  it('pre has tabIndex={0}', () => {
    render(<CodeBlock code="const x = 1;" />)
    const pre = screen.getByRole('group')
    expect(pre).toHaveAttribute('tabindex', '0')
  })

  it('pre has role="group"', () => {
    render(<CodeBlock code="const x = 1;" />)
    const pre = screen.getByRole('group')
    expect(pre.tagName).toBe('PRE')
  })

  it('pre has aria-label from label prop', () => {
    render(<CodeBlock code="const x = 1;" label="example.js" />)
    const pre = screen.getByRole('group', { name: 'example.js' })
    expect(pre).toBeInTheDocument()
  })

  it('pre has aria-label="Code" by default', () => {
    render(<CodeBlock code="const x = 1;" />)
    const pre = screen.getByRole('group', { name: 'Code' })
    expect(pre).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Label chip
// ---------------------------------------------------------------------------

describe('CodeBlock label chip', () => {
  it('renders label when provided', () => {
    render(<CodeBlock code="const x = 1;" label="script.js" />)
    expect(screen.getByText('script.js')).toBeInTheDocument()
  })

  it('does not render label when not provided', () => {
    render(<CodeBlock code="const x = 1;" />)
    // Verify label text doesn't exist
    expect(screen.queryByText(/\.js|script/)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

describe('CodeBlock copy button', () => {
  it('renders copy button by default', () => {
    render(<CodeBlock code="const x = 1;" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveTextContent('Copy')
  })

  it('button click triggers clipboard write attempt', async () => {
    const user = userEvent.setup()
    const testCode = 'const x = 1;'
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })
    render(<CodeBlock code={testCode} />)
    const btn = screen.getByRole('button')
    await user.click(btn)
    expect(mockWriteText).toHaveBeenCalledWith(testCode)
    vi.restoreAllMocks()
  })

  it('hides copy button when copyable=false', () => {
    render(<CodeBlock code="const x = 1;" copyable={false} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Header visibility
// ---------------------------------------------------------------------------

describe('CodeBlock header row', () => {
  it('shows header when label is provided', () => {
    render(<CodeBlock code="const x = 1;" label="script.js" />)
    expect(screen.getByText('script.js')).toBeInTheDocument()
  })

  it('shows header when copyable=true (default)', () => {
    render(<CodeBlock code="const x = 1;" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('hides header when label=undefined and copyable=false', () => {
    render(<CodeBlock code="const x = 1;" copyable={false} />)
    // No button, no label — header should be completely absent
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    // The pre should still be there
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('shows header when label provided even if copyable=false', () => {
    render(<CodeBlock code="const x = 1;" label="script.js" copyable={false} />)
    expect(screen.getByText('script.js')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Live region announcement
// ---------------------------------------------------------------------------

describe('CodeBlock live region', () => {
  it('renders live region when copied', async () => {
    const user = userEvent.setup()
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })
    render(<CodeBlock code="const x = 1;" />)
    const btn = screen.getByRole('button')
    await user.click(btn)
    const liveRegion = await screen.findByText('Copied to clipboard')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    vi.restoreAllMocks()
  })
})
