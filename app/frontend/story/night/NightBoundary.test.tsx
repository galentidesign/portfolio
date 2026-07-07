import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { NightBoundary } from './NightBoundary'

function renderBoundary(direction: 'enter' | 'exit') {
  return render(
    <MotionPrefProvider>
      <NightBoundary direction={direction} />
    </MotionPrefProvider>,
  )
}

describe('NightBoundary', () => {
  beforeEach(() => {
    // Reduced motion keeps jsdom on the instant path — no dynamic GSAP import.
    document.documentElement.dataset.motion = 'reduced'
  })

  afterEach(() => {
    delete document.documentElement.dataset.motion
  })

  it('renders as a decorative crossing carrying its direction', () => {
    renderBoundary('enter')
    const boundary = screen.getByTestId('night-boundary-enter')
    expect(boundary).toHaveAttribute('aria-hidden', 'true')
    expect(boundary).toHaveAttribute('data-direction', 'enter')
  })

  it('binds the gradient bridge to the night zone', () => {
    const { container } = renderBoundary('enter')
    const bridge = container.querySelector('[data-zone="night"]')
    expect(bridge).not.toBeNull()
  })

  it('pre-draws the ember horizon in the base render (reduced-motion parity)', () => {
    const { container } = renderBoundary('enter')
    const line = container.querySelector('[data-night-horizon]')
    expect(line).not.toBeNull()
    // No inline dash state — the line is fully drawn until the motion layer
    // (never loaded under reduced motion) takes over.
    expect(line).not.toHaveAttribute('style')
  })

  it('contains no focusable elements — keyboard order is untouched', () => {
    const { container } = renderBoundary('enter')
    expect(container.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })

  it('renders the exit direction for the resolve back to light', () => {
    renderBoundary('exit')
    expect(screen.getByTestId('night-boundary-exit')).toHaveAttribute('data-direction', 'exit')
  })
})
