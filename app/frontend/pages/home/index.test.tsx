import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './index'

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

describe('Home', () => {
  it('renders the J Galenti heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: 'J Galenti' })).toBeInTheDocument()
  })

  it('renders a link to /system', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /Explore the design system/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/system')
  })
})
