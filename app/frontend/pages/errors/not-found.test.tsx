import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NotFound from './not-found'

// Head and Button with href require the Inertia runtime; rendered title/navigation
// covered by e2e. Button with href renders an anchor, so we mock it to return a
// plain <a> for testing.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
}))

vi.mock('@/ds/components/Button/Button', () => ({
  Button: ({
    href,
    children,
    variant,
    ...props
  }: {
    href?: string
    children: ReactNode
    variant?: string
  }) =>
    href ? (
      <a href={href} data-variant={variant} {...props}>
        {children}
      </a>
    ) : (
      <button data-variant={variant} {...props}>
        {children}
      </button>
    ),
}))

describe('NotFound', () => {
  it('renders the 404 code', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders the title as the page h1', () => {
    render(<NotFound />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Nothing is assembled at this address' }),
    ).toBeInTheDocument()
  })

  it('renders the primary button with correct href', () => {
    render(<NotFound />)
    const startButton = screen.getByRole('link', { name: /Start the story/i })
    expect(startButton).toBeInTheDocument()
    expect(startButton).toHaveAttribute('href', '/')
  })

  it('renders the secondary button with correct href', () => {
    render(<NotFound />)
    const skipButton = screen.getByRole('link', { name: /Skip to the work/i })
    expect(skipButton).toBeInTheDocument()
    expect(skipButton).toHaveAttribute('href', '/work')
  })
})
