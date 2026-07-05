import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Colophon from './index'

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

describe('Colophon', () => {
  it('renders the colophon heading', () => {
    render(<Colophon />)
    expect(screen.getByRole('heading', { name: 'Colophon' })).toBeInTheDocument()
  })

  it('renders the milestone line', () => {
    render(<Colophon />)
    expect(
      screen.getByText(
        'The colophon lands with milestone M9 — stack, craft-bar numbers, and the privacy note.',
      ),
    ).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<Colophon />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})
