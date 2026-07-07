import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import WorkIndex from './index'

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

// useFx gates on the motion-pref context; pin the gate to reduced so the
// page renders its static base with no dynamic fx import (home test pattern).
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => ({ reduced: true, manualReduced: false, setManualReduced: vi.fn() }),
}))

vi.mock('@/ds/components/Card/Card', () => ({
  Card: ({
    href,
    title,
    footer,
    children,
  }: {
    href?: string
    title?: string
    footer?: ReactNode
    children: ReactNode
  }) => {
    const content = (
      <>
        {title !== undefined && <span>{title}</span>}
        <div>{children}</div>
        {footer !== undefined && <span>{footer}</span>}
      </>
    )
    return href !== undefined ? (
      <a href={href} data-testid="card">
        {content}
      </a>
    ) : (
      <div data-testid="card">{content}</div>
    )
  },
}))

vi.mock('@/ds/components/Button/Button', () => ({
  Button: ({
    href,
    children,
    variant,
  }: {
    href?: string
    children: ReactNode
    variant?: string
  }) =>
    href !== undefined ? (
      <a href={href} data-variant={variant}>
        {children}
      </a>
    ) : (
      <button data-variant={variant}>{children}</button>
    ),
}))

describe('WorkIndex', () => {
  it('renders the thesis heading', () => {
    render(<WorkIndex />)
    expect(screen.getByRole('heading', { name: /Design technologist/i })).toBeInTheDocument()
  })

  it('renders the thesis annotation', () => {
    render(<WorkIndex />)
    expect(screen.getByText('The 90-second version')).toBeInTheDocument()
  })

  it('renders the agentic-design-ops study card linking to the right href', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: /Agentic design-ops/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work/agentic-design-ops')
  })

  it('renders the shadcn-to-polaris study card linking to the right href', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: /shadcn/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work/shadcn-to-polaris')
  })

  it('renders the design system card linking to /system', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: /The design system behind this site/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/system')
  })

  it('renders the résumé button with href /resume', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: /Résumé/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/resume')
  })

  it('renders the mailto link with the correct email address', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: 'galentidesign@gmail.com' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'mailto:galentidesign@gmail.com')
  })

  it('renders the LinkedIn link', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: 'LinkedIn' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/jgalenti')
  })

  it('renders the GitHub repo link', () => {
    render(<WorkIndex />)
    const link = screen.getByRole('link', { name: /Source — this site/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/galentidesign/portfolio')
  })
})
