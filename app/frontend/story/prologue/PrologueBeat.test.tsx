import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrologueBeat } from './PrologueBeat'

// ── Motion gate mock ──────────────────────────────────────────────────────────
// Per-test control over the reduced flag without a live MotionPrefProvider.
const motionPref = { reduced: true, manualReduced: false, setManualReduced: vi.fn() }
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => motionPref,
}))

// ── IntersectionObserver stub ─────────────────────────────────────────────────
// jsdom does not implement IntersectionObserver. A class-based stub is
// required because the component uses `new IntersectionObserver(...)` — a
// plain vi.fn() arrow wrapper is not constructable.
let capturedCallback: IntersectionObserverCallback | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    capturedCallback = cb
  }
  observe = mockObserve
  disconnect = mockDisconnect
}

beforeEach(() => {
  motionPref.reduced = true
  capturedCallback = null
  mockObserve.mockClear()
  mockDisconnect.mockClear()

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Verbatim era labels (character-for-character) ─────────────────────────────

const ERA_LABELS = [
  '2004–2007 · Audio & Video Production',
  '2007–2010 · Freelance Branding, Marketing & Web Design',
  '2010–2012 · iOS App UX/UI Design',
  '2012–2017 · Teaching Graphic Design, Audio & Film Production (University-level)',
] as const

// ── Heading ───────────────────────────────────────────────────────────────────

describe('PrologueBeat heading', () => {
  it('renders the h2 with the verbatim annotation text', () => {
    render(<PrologueBeat />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Prologue · 2004–2013' }),
    ).toBeInTheDocument()
  })

  it('gives the heading an id that the section references with aria-labelledby', () => {
    render(<PrologueBeat />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAttribute('id', 'prologue-heading')
    const section = screen.getByTestId('prologue-beat')
    expect(section).toHaveAttribute('aria-labelledby', 'prologue-heading')
  })
})

// ── Verbatim era labels ───────────────────────────────────────────────────────

describe('PrologueBeat era labels', () => {
  it('renders all four verbatim era labels', () => {
    render(<PrologueBeat />)
    const beat = screen.getByTestId('prologue-beat')
    for (const label of ERA_LABELS) {
      expect(beat.textContent).toContain(label)
    }
  })

  it('renders station 1 verbatim: "2004–2007 · Audio & Video Production"', () => {
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat').textContent).toContain(
      '2004–2007 · Audio & Video Production',
    )
  })

  it('renders station 2 verbatim: "2007–2010 · Freelance Branding, Marketing & Web Design"', () => {
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat').textContent).toContain(
      '2007–2010 · Freelance Branding, Marketing & Web Design',
    )
  })

  it('renders station 3 verbatim: "2010–2012 · iOS App UX/UI Design"', () => {
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat').textContent).toContain(
      '2010–2012 · iOS App UX/UI Design',
    )
  })

  it('renders station 4 verbatim: includes "(University-level)"', () => {
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat').textContent).toContain(
      '2012–2017 · Teaching Graphic Design, Audio & Film Production (University-level)',
    )
  })
})

// ── Station data attributes ───────────────────────────────────────────────────

describe('PrologueBeat stations', () => {
  it('renders exactly four stations', () => {
    const { container } = render(<PrologueBeat />)
    expect(container.querySelectorAll('[data-station]')).toHaveLength(4)
  })

  it('stations carry data-station="1" through "4"', () => {
    const { container } = render(<PrologueBeat />)
    for (const n of [1, 2, 3, 4]) {
      expect(container.querySelector(`[data-station="${n}"]`)).toBeInTheDocument()
    }
  })
})

// ── Reduced motion — data-revealed on first render, no observer ───────────────

describe('PrologueBeat reduced motion', () => {
  it('sets data-revealed on the section immediately (first render)', () => {
    motionPref.reduced = true
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat')).toHaveAttribute('data-revealed')
  })

  it('does not create an IntersectionObserver under reduced motion', () => {
    motionPref.reduced = true
    render(<PrologueBeat />)
    expect(mockObserve).not.toHaveBeenCalled()
  })
})

// ── Normal motion — IntersectionObserver drives the reveal ────────────────────

describe('PrologueBeat normal motion', () => {
  it('section starts without data-revealed before the observer fires', () => {
    motionPref.reduced = false
    render(<PrologueBeat />)
    expect(screen.getByTestId('prologue-beat')).not.toHaveAttribute('data-revealed')
  })

  it('creates an IntersectionObserver and observes the section', () => {
    motionPref.reduced = false
    render(<PrologueBeat />)
    // The observer was created and the section element was passed to observe().
    expect(mockObserve).toHaveBeenCalledWith(screen.getByTestId('prologue-beat'))
  })

  it('sets data-revealed when the observer callback fires with isIntersecting: true', () => {
    motionPref.reduced = false
    render(<PrologueBeat />)

    expect(screen.getByTestId('prologue-beat')).not.toHaveAttribute('data-revealed')

    act(() => {
      capturedCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByTestId('prologue-beat')).toHaveAttribute('data-revealed')
  })

  it('does not set data-revealed when isIntersecting is false', () => {
    motionPref.reduced = false
    render(<PrologueBeat />)

    act(() => {
      capturedCallback!(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })

    expect(screen.getByTestId('prologue-beat')).not.toHaveAttribute('data-revealed')
  })

  it('disconnects the observer after revealing', () => {
    motionPref.reduced = false
    render(<PrologueBeat />)

    act(() => {
      capturedCallback!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    })

    expect(mockDisconnect).toHaveBeenCalled()
  })
})
