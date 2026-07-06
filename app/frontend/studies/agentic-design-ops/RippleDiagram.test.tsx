import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RippleDiagram } from './RippleDiagram'

describe('RippleDiagram', () => {
  it('renders the diagram figure', () => {
    const { container } = render(<RippleDiagram />)
    expect(container.querySelector('[data-testid="ripple-diagram"]')).toBeInTheDocument()
  })

  it('renders the Token source node', () => {
    render(<RippleDiagram />)
    expect(screen.getByTestId('ripple-node-source')).toHaveTextContent('Token source')
  })

  it('renders the Components target node', () => {
    render(<RippleDiagram />)
    expect(screen.getByTestId('ripple-node-components')).toHaveTextContent('Components')
  })

  it('renders the Docs target node', () => {
    render(<RippleDiagram />)
    expect(screen.getByTestId('ripple-node-docs')).toHaveTextContent('Docs')
  })

  it('renders the Design library target node', () => {
    render(<RippleDiagram />)
    expect(screen.getByTestId('ripple-node-design-library')).toHaveTextContent('Design library')
  })

  it('marks every SVG connector as decorative (aria-hidden)', () => {
    const { container } = render(<RippleDiagram />)
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('renders a figcaption describing the propagation', () => {
    const { container } = render(<RippleDiagram />)
    const caption = container.querySelector('figcaption')
    expect(caption).not.toBeNull()
    expect(caption?.textContent?.trim().length).toBeGreaterThan(0)
  })
})
