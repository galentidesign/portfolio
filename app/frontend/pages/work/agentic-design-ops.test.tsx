import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AgenticDesignOps from './agentic-design-ops'

// Head and Link require the Inertia runtime; rendered title/navigation covered by e2e.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe('AgenticDesignOps', () => {
  it('renders a single h1 with the study title', () => {
    render(<AgenticDesignOps />)
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent('Agentic design-ops')
  })

  it('renders all four section headings', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByRole('heading', { name: 'Decision', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Build', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ripple', level: 2 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Connect to targets', level: 2 }),
    ).toBeInTheDocument()
  })

  it('renders landed prose in all five sections (slots retired at M10)', () => {
    render(<AgenticDesignOps />)
    // One anchor phrase per former slot: framing, decision, build, ripple, close.
    expect(screen.getByText(/the design system is my deity/i)).toBeInTheDocument()
    expect(screen.getByText(/The pipeline was the problem/i)).toBeInTheDocument()
    expect(screen.getByText(/Review gets its own UI/i)).toBeInTheDocument()
    expect(screen.getByText(/Nobody had to push adoption/i)).toBeInTheDocument()
    expect(screen.getByText(/This site is its own evidence/i)).toBeInTheDocument()
  })

  it('the close links its evidence: Chapter 3 and the colophon', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByRole('link', { name: /Chapter 3 of the story/i })).toHaveAttribute(
      'href',
      '/story/agentic',
    )
    expect(screen.getByRole('link', { name: /^colophon$/i })).toHaveAttribute('href', '/colophon')
  })

  it('renders the orchestration diagram node labels', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByTestId('orch-node-orchestrator')).toHaveTextContent('Orchestrator')
    expect(screen.getByTestId('orch-node-agent-a')).toHaveTextContent('Agent A')
    expect(screen.getByTestId('orch-node-agent-b')).toHaveTextContent('Agent B')
    expect(screen.getByTestId('orch-node-agent-c')).toHaveTextContent('Agent C')
    expect(screen.getByTestId('orch-node-gate')).toHaveTextContent('Review gate')
    expect(screen.getByTestId('orch-node-artifact')).toHaveTextContent('Artifact')
  })

  it('renders the ripple diagram node labels', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByTestId('ripple-node-source')).toHaveTextContent('Token source')
    expect(screen.getByTestId('ripple-node-components')).toHaveTextContent('Components')
    expect(screen.getByTestId('ripple-node-docs')).toHaveTextContent('Docs')
    expect(screen.getByTestId('ripple-node-design-library')).toHaveTextContent('Design library')
  })

  it('renders pattern gallery exhibits as inert', () => {
    const { container } = render(<AgenticDesignOps />)
    const exhibits = container.querySelectorAll('[data-exhibit]')
    expect(exhibits.length).toBeGreaterThan(0)
    for (const exhibit of exhibits) {
      expect(exhibit).toHaveAttribute('inert')
    }
  })

  it('renders nav links to /work, /work/shadcn-to-polaris, and /system', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByRole('link', { name: 'All work' })).toHaveAttribute('href', '/work')
    expect(screen.getByRole('link', { name: 'shadcn → Polaris' })).toHaveAttribute(
      'href',
      '/work/shadcn-to-polaris',
    )
    expect(screen.getByRole('link', { name: 'Design system' })).toHaveAttribute('href', '/system')
  })
})
