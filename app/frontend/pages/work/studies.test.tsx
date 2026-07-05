import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AgenticDesignOps from './agentic-design-ops'
import ShadcnToPolaris from './shadcn-to-polaris'

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
  it('renders the study heading', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByRole('heading', { name: 'Agentic design-ops' })).toBeInTheDocument()
  })

  it('renders the milestone line', () => {
    render(<AgenticDesignOps />)
    expect(screen.getByText('This study lands with milestone M8.')).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<AgenticDesignOps />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})

describe('ShadcnToPolaris', () => {
  it('renders the study heading', () => {
    render(<ShadcnToPolaris />)
    expect(screen.getByRole('heading', { name: 'shadcn → Polaris' })).toBeInTheDocument()
  })

  it('renders the milestone line', () => {
    render(<ShadcnToPolaris />)
    expect(screen.getByText('This study lands with milestone M8.')).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<ShadcnToPolaris />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})
