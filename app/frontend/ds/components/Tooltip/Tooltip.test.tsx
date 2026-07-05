import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Tooltip } from './Tooltip'

// ─── vitest fake-timers shim ─────────────────────────────────────────────────
// RTL's asyncWrapper (which user-event routes every API call through) drains
// the microtask queue by awaiting a 0ms setTimeout, and it only advances fake
// timers when a `jest` global exposes advanceTimersByTime. Vitest defines no
// `jest` global, so any user-event call would hang forever under
// vi.useFakeTimers(). This minimal shim lives only here — never in the
// component.
const globalWithJest = globalThis as typeof globalThis & {
  jest?: { advanceTimersByTime: (ms: number) => void }
}

function setupWithFakeTimers() {
  vi.useFakeTimers()
  globalWithJest.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) }
  return userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete globalWithJest.jest
})

// ─── Hidden by default ───────────────────────────────────────────────────────

describe('Tooltip default state', () => {
  it('is hidden by default and the trigger carries no aria-describedby', () => {
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby')
  })
})

// ─── Focus shows immediately ─────────────────────────────────────────────────

describe('Tooltip focus', () => {
  it('shows immediately on focus and wires aria-describedby to the tooltip id', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Saves your work">
        <button type="button">Save</button>
      </Tooltip>,
    )
    await user.tab()
    const trigger = screen.getByRole('button', { name: 'Save' })
    expect(trigger).toHaveFocus()

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip.id).toBeTruthy()
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
  })

  it('hides on blur and removes aria-describedby', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.tab() // focus leaves the trigger
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby')
  })
})

// ─── Hover intent ────────────────────────────────────────────────────────────

describe('Tooltip hover intent', () => {
  it('shows after the 150ms hover-intent delay, not before', async () => {
    const user = setupWithFakeTimers()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(149)
    })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('cancels a pending show when the pointer leaves before the delay elapses', async () => {
    const user = setupWithFakeTimers()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    await user.hover(trigger)
    act(() => {
      vi.advanceTimersByTime(100)
    })
    await user.unhover(trigger)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('hides immediately on unhover after it has shown', async () => {
    const user = setupWithFakeTimers()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    await user.hover(trigger)
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.unhover(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

// ─── Escape dismissal (APG) ──────────────────────────────────────────────────

describe('Tooltip Escape dismissal', () => {
  it('hides instantly on Escape while visible, keeping focus on the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveFocus()
  })
})

// ─── aria-describedby merging ────────────────────────────────────────────────

describe('Tooltip aria-describedby merging', () => {
  it('preserves an existing aria-describedby and joins the tooltip id while visible', async () => {
    const user = userEvent.setup()
    render(
      <>
        <p id="external-hint">External hint</p>
        <Tooltip content="Tip text">
          <button type="button" aria-describedby="external-hint">
            Go
          </button>
        </Tooltip>
      </>,
    )
    const trigger = screen.getByRole('button')
    // Hidden: the child's own describedby is untouched.
    expect(trigger).toHaveAttribute('aria-describedby', 'external-hint')

    await user.tab()
    const tooltip = screen.getByRole('tooltip')
    expect(trigger.getAttribute('aria-describedby')).toBe(`external-hint ${tooltip.id}`)

    await user.tab()
    // Hidden again: back to only the original value.
    expect(trigger).toHaveAttribute('aria-describedby', 'external-hint')
  })
})

// ─── Content + position attribute ────────────────────────────────────────────

describe('Tooltip content and position', () => {
  it('renders the content text while visible', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Copies the link to your clipboard">
        <button type="button">Copy</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Copies the link to your clipboard')
  })

  it('sets data-position="top" by default', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-position', 'top')
  })

  it('sets data-position="bottom" when position="bottom"', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip text" position="bottom">
        <button type="button">Go</button>
      </Tooltip>,
    )
    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-position', 'bottom')
  })

  it('flips to bottom when the viewport lacks space above the trigger', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip text">
        <button type="button">Go</button>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button')
    const wrapper = trigger.parentElement as HTMLSpanElement
    // Trigger sits 10px from the viewport top — no room for a top tooltip.
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      bottom: 34,
      left: 100,
      right: 180,
      width: 80,
      height: 24,
      x: 100,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect)

    await user.tab()
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-position', 'bottom')
  })
})
