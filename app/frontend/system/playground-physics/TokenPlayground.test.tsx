import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { semanticTokens } from '@/ds/tokens/generated/skins'
import { PLAYGROUND_CHIPS, TokenPlayground } from './TokenPlayground'

// jsdom has no IntersectionObserver, so the physics chunk is never imported
// here — every render below IS the static base render (grid = content).

function renderPlayground() {
  return render(
    <MotionPrefProvider>
      <TokenPlayground />
    </MotionPrefProvider>,
  )
}

describe('TokenPlayground', () => {
  it('renders a labeled section with the playground heading and description', () => {
    renderPlayground()
    const section = screen.getByTestId('token-playground')
    expect(
      within(section).getByRole('heading', { level: 2, name: 'Token playground' }),
    ).toBeInTheDocument()
    expect(
      within(section).getByText(/tokens, subject to gravity\. Drag them\./i),
    ).toBeInTheDocument()
  })

  it('renders the chip grid as a list named "Design tokens", one item per chip', () => {
    renderPlayground()
    const list = screen.getByRole('list', { name: 'Design tokens' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(PLAYGROUND_CHIPS.length)
  })

  it('derives chips from the real semantic token exports', () => {
    renderPlayground()
    // Color chips are a curated subset of semanticTokens.color; radius and
    // type chips cover their full role sets.
    const colorCount = PLAYGROUND_CHIPS.filter((c) => c.kind === 'color').length
    expect(colorCount).toBeGreaterThanOrEqual(10)
    expect(colorCount).toBeLessThanOrEqual(semanticTokens.color.length)
    expect(PLAYGROUND_CHIPS.filter((c) => c.kind === 'radius')).toHaveLength(
      semanticTokens.radius.length,
    )
    expect(PLAYGROUND_CHIPS.filter((c) => c.kind === 'type')).toHaveLength(3)
  })

  it('shows a visible label for every chip (color, radius, type)', () => {
    renderPlayground()
    const list = screen.getByRole('list', { name: 'Design tokens' })
    expect(within(list).getByText('accent')).toBeInTheDocument()
    expect(within(list).getByText('radius-pill')).toBeInTheDocument()
    expect(within(list).getByText('type-display')).toBeInTheDocument()
  })

  it('drives color swatches from current-skin custom properties', () => {
    renderPlayground()
    const list = screen.getByRole('list', { name: 'Design tokens' })
    const accentChip = within(list).getByText('accent').closest('li')!
    const demo = accentChip.querySelector('span')!
    expect(demo.style.backgroundColor).toBe('var(--color-accent)')
  })

  it('marks the type specimen text decorative (label carries the content)', () => {
    renderPlayground()
    const list = screen.getByRole('list', { name: 'Design tokens' })
    const typeChip = within(list).getByText('type-display').closest('li')!
    expect(typeChip.querySelector('[aria-hidden="true"]')).toHaveTextContent('Ag')
  })

  it('static mode: grid is exposed to AT, no reset button, no mirror list', () => {
    renderPlayground()
    const list = screen.getByRole('list', { name: 'Design tokens' })
    expect(list).not.toHaveAttribute('aria-hidden')
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('list', { name: 'Design tokens' })).toHaveLength(1)
  })

  it('contains no focusable elements in the static pen — keyboard order untouched', () => {
    renderPlayground()
    const pen = screen.getByTestId('playground-pen')
    expect(pen.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0)
  })

  describe('reduced motion', () => {
    beforeEach(() => {
      document.documentElement.dataset.motion = 'reduced'
    })

    afterEach(() => {
      delete document.documentElement.dataset.motion
    })

    it('renders the identical static grid (physics path never engages)', () => {
      renderPlayground()
      const list = screen.getByRole('list', { name: 'Design tokens' })
      expect(within(list).getAllByRole('listitem')).toHaveLength(PLAYGROUND_CHIPS.length)
      expect(list).not.toHaveAttribute('aria-hidden')
      expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument()
      expect(screen.getByTestId('playground-pen')).not.toHaveAttribute('data-physics')
    })
  })
})
