import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrchestrationDiagram } from './OrchestrationDiagram'

describe('OrchestrationDiagram', () => {
  it('renders the diagram figure', () => {
    const { container } = render(<OrchestrationDiagram />)
    expect(container.querySelector('[data-testid="orchestration-diagram"]')).toBeInTheDocument()
  })

  it('renders the Orchestrator node', () => {
    render(<OrchestrationDiagram />)
    expect(screen.getByTestId('orch-node-orchestrator')).toHaveTextContent('Orchestrator')
  })

  it('renders Agent A, Agent B, and Agent C nodes', () => {
    render(<OrchestrationDiagram />)
    expect(screen.getByTestId('orch-node-agent-a')).toHaveTextContent('Agent A')
    expect(screen.getByTestId('orch-node-agent-b')).toHaveTextContent('Agent B')
    expect(screen.getByTestId('orch-node-agent-c')).toHaveTextContent('Agent C')
  })

  it('renders the Review gate node', () => {
    render(<OrchestrationDiagram />)
    expect(screen.getByTestId('orch-node-gate')).toHaveTextContent('Review gate')
  })

  it('renders the Artifact node', () => {
    render(<OrchestrationDiagram />)
    expect(screen.getByTestId('orch-node-artifact')).toHaveTextContent('Artifact')
  })

  it('marks every SVG connector as decorative (aria-hidden)', () => {
    const { container } = render(<OrchestrationDiagram />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('renders a figcaption describing the flow', () => {
    const { container } = render(<OrchestrationDiagram />)
    const caption = container.querySelector('figcaption')
    expect(caption).not.toBeNull()
    expect(caption?.textContent?.trim().length).toBeGreaterThan(0)
  })
})
