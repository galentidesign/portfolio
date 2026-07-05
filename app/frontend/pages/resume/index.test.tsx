import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Resume from './index'

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

describe('Resume', () => {
  it('renders the résumé heading', () => {
    render(<Resume />)
    expect(screen.getByRole('heading', { name: 'Résumé' })).toBeInTheDocument()
  })

  it('renders the milestone line', () => {
    render(<Resume />)
    expect(
      screen.getByText(
        'The résumé page lands with milestone M9 — web summary plus a designed PDF.',
      ),
    ).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<Resume />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})
