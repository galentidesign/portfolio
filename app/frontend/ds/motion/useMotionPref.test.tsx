import { render, screen, fireEvent, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MotionPrefProvider, useMotionPref } from './useMotionPref'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { reduced, manualReduced, setManualReduced } = useMotionPref()
  return (
    <>
      <span data-testid="reduced">{String(reduced)}</span>
      <span data-testid="manual">{String(manualReduced)}</span>
      <button onClick={() => setManualReduced(true)}>enable-reduced</button>
      <button onClick={() => setManualReduced(false)}>disable-reduced</button>
    </>
  )
}

function TestConsumerOutsideProvider() {
  useMotionPref()
  return null
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.motion
  localStorage.clear()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MotionPrefProvider / useMotionPref', () => {
  it('defaults to all-false when no attr, no storage, no OS query', () => {
    render(
      <MotionPrefProvider>
        <TestConsumer />
      </MotionPrefProvider>,
    )
    expect(screen.getByTestId('reduced')).toHaveTextContent('false')
    expect(screen.getByTestId('manual')).toHaveTextContent('false')
  })

  it('reads initial manualReduced from data-motion="reduced" attribute', () => {
    document.documentElement.dataset.motion = 'reduced'
    render(
      <MotionPrefProvider>
        <TestConsumer />
      </MotionPrefProvider>,
    )
    expect(screen.getByTestId('reduced')).toHaveTextContent('true')
    expect(screen.getByTestId('manual')).toHaveTextContent('true')
  })

  it('setManualReduced(true) sets reduced, attr, and localStorage', () => {
    render(
      <MotionPrefProvider>
        <TestConsumer />
      </MotionPrefProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'enable-reduced' }))
    })
    expect(screen.getByTestId('reduced')).toHaveTextContent('true')
    expect(screen.getByTestId('manual')).toHaveTextContent('true')
    expect(document.documentElement.dataset.motion).toBe('reduced')
    expect(localStorage.getItem('portfolio:motion')).toBe('reduced')
  })

  it('setManualReduced(false) clears reduced, attr, and localStorage', () => {
    document.documentElement.dataset.motion = 'reduced'
    localStorage.setItem('portfolio:motion', 'reduced')
    render(
      <MotionPrefProvider>
        <TestConsumer />
      </MotionPrefProvider>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'disable-reduced' }))
    })
    expect(screen.getByTestId('reduced')).toHaveTextContent('false')
    expect(screen.getByTestId('manual')).toHaveTextContent('false')
    expect(document.documentElement.dataset.motion).toBeUndefined()
    expect(localStorage.getItem('portfolio:motion')).toBeNull()
  })

  it('OS prefers-reduced-motion query → reduced is true even when manualReduced is false', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn().mockReturnValue(true),
        }) as unknown as MediaQueryList,
    )

    render(
      <MotionPrefProvider>
        <TestConsumer />
      </MotionPrefProvider>,
    )

    expect(screen.getByTestId('reduced')).toHaveTextContent('true')
    expect(screen.getByTestId('manual')).toHaveTextContent('false')
  })
})

describe('useMotionPref', () => {
  it('throws a descriptive error when called outside a MotionPrefProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumerOutsideProvider />)).toThrow(
      'useMotionPref must be called within a <MotionPrefProvider>',
    )
    spy.mockRestore()
  })
})
