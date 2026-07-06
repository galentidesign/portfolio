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

  it('renders every expected prose slot id', () => {
    const { container } = render(<AgenticDesignOps />)
    const SLOT_IDS = [
      'study-a/framing',
      'study-a/decision',
      'study-a/build',
      'study-a/ripple',
      'study-a/close',
    ]
    for (const id of SLOT_IDS) {
      expect(container.querySelector(`[data-prose-slot="${id}"]`)).toBeInTheDocument()
    }
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
