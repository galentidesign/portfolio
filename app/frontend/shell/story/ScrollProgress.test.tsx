import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollProgress } from './ScrollProgress'

// ─── rAF stub ────────────────────────────────────────────────────────────────
// ScrollProgress schedules position updates via requestAnimationFrame to
// throttle scroll/resize events. In jsdom, rAF is polyfilled with a ~16ms
// setTimeout, which means callbacks are never executed synchronously during
// tests. Stub rAF to invoke the callback immediately so that firing a scroll
// event synchronously reflects the updated scaleX value.
//
// Note: the stub invokes the callback before returning, so inside the callback
// `rafId` is set to null by `measure()`. The stub return value (0) is then
// assigned to `rafId` after the callback completes. Within a single test this
// is fine: each test fires scroll at most once per component instance, so the
// single deduplication guard doesn't block subsequent assertions.

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  // Restore prototype getters for document dimensions so stubs from one test
  // don't bleed into the next.
  for (const prop of ['scrollHeight', 'clientHeight'] as const) {
    try {
      // Delete the own property override; the prototype getter takes over again.
      delete (document.documentElement as unknown as Record<string, unknown>)[prop]
    } catch {
      // Ignore non-configurable descriptors.
    }
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Override scrollHeight and clientHeight on documentElement so the component
 * sees a scrollable (or non-scrollable) document.
 */
function stubDocumentDimensions(scrollHeight: number, clientHeight: number) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  })
  Object.defineProperty(document.documentElement, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  })
}

// ─── Hidden when document does not overflow ───────────────────────────────────

describe('ScrollProgress hidden when no overflow', () => {
  it('renders nothing when scrollHeight equals clientHeight', () => {
    stubDocumentDimensions(500, 500)
    render(<ScrollProgress />)
    expect(screen.queryByTestId('scroll-progress')).not.toBeInTheDocument()
  })

  it('renders nothing when scrollHeight is less than clientHeight', () => {
    stubDocumentDimensions(400, 500)
    render(<ScrollProgress />)
    expect(screen.queryByTestId('scroll-progress')).not.toBeInTheDocument()
  })

  it('renders nothing in the default jsdom environment (no layout engine)', () => {
    // jsdom returns 0 for both dims without layout → no overflow.
    render(<ScrollProgress />)
    expect(screen.queryByTestId('scroll-progress')).not.toBeInTheDocument()
  })
})

// ─── Visible when document overflows ─────────────────────────────────────────

describe('ScrollProgress visible when document overflows', () => {
  it('renders the track element when scrollHeight > clientHeight', () => {
    stubDocumentDimensions(1000, 500)
    render(<ScrollProgress />)
    expect(screen.getByTestId('scroll-progress')).toBeInTheDocument()
  })

  it('marks the track as aria-hidden for decorative use', () => {
    stubDocumentDimensions(1000, 500)
    render(<ScrollProgress />)
    expect(screen.getByTestId('scroll-progress')).toHaveAttribute('aria-hidden', 'true')
  })

  it('starts at scaleX(0) before any scroll', () => {
    stubDocumentDimensions(1000, 500)
    // scrollTop defaults to 0 → progress = 0/500 = 0
    render(<ScrollProgress />)
    const track = screen.getByTestId('scroll-progress')
    const fill = track.firstElementChild as HTMLElement
    expect(fill.style.transform).toBe('scaleX(0)')
  })
})

// ─── scaleX updates on scroll ────────────────────────────────────────────────

describe('ScrollProgress scaleX updates on scroll', () => {
  it('reflects a mid-page scroll position as scaleX(0.5)', () => {
    stubDocumentDimensions(1000, 500)
    render(<ScrollProgress />)

    // Place scrollTop at 250 of 500 scrollable px → 0.5
    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      get: () => 250,
    })

    act(() => {
      fireEvent.scroll(window)
    })

    const track = screen.getByTestId('scroll-progress')
    const fill = track.firstElementChild as HTMLElement
    expect(fill.style.transform).toBe('scaleX(0.5)')
  })

  it('reflects a full scroll to the bottom as scaleX(1)', () => {
    stubDocumentDimensions(1000, 500)
    render(<ScrollProgress />)

    Object.defineProperty(document.documentElement, 'scrollTop', {
      configurable: true,
      get: () => 500,
    })

    act(() => {
      fireEvent.scroll(window)
    })

    const track = screen.getByTestId('scroll-progress')
    const fill = track.firstElementChild as HTMLElement
    expect(fill.style.transform).toBe('scaleX(1)')
  })
})
