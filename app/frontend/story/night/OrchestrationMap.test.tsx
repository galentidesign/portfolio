import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { OrchestrationMap } from './OrchestrationMap'

function renderMap() {
  return render(
    <MotionPrefProvider>
      <OrchestrationMap />
    </MotionPrefProvider>,
  )
}

describe('OrchestrationMap', () => {
  beforeEach(() => {
    // Reduced motion keeps jsdom on the instant path — no dynamic GSAP import.
    document.documentElement.dataset.motion = 'reduced'
  })

  afterEach(() => {
    delete document.documentElement.dataset.motion
  })

  it('renders the figure with a decorative SVG and a visible flow caption', () => {
    const { container } = renderMap()
    expect(screen.getByTestId('orchestration-map')).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText(/one orchestrator fans work to parallel agents/i)).toBeInTheDocument()
  })

  it('draws six nodes and seven edges (fan-out, fan-in, gate hand-off)', () => {
    const { container } = renderMap()
    expect(container.querySelectorAll('[data-orch-node]')).toHaveLength(6)
    expect(container.querySelectorAll('[data-orch-edge]')).toHaveLength(7)
  })

  it('labels every station of the flow', () => {
    const { container } = renderMap()
    const labels = Array.from(container.querySelectorAll('[data-orch-node] text')).map(
      (t) => t.textContent,
    )
    expect(labels).toEqual([
      'Orchestrator',
      'Agent A',
      'Agent B',
      'Agent C',
      'Review gate',
      'Artifact',
    ])
  })

  it('marks exactly two agent nodes for the micro-orbit', () => {
    const { container } = renderMap()
    const orbiters = container.querySelectorAll('[data-orch-orbit]')
    expect(orbiters).toHaveLength(2)
    for (const node of orbiters) {
      expect(node.getAttribute('data-role')).toBe('agent')
    }
  })

  it('renders fully drawn in the base state (no inline styles anywhere)', () => {
    const { container } = renderMap()
    expect(container.querySelectorAll('svg [style]')).toHaveLength(0)
  })
})
