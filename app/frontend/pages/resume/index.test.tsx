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

vi.mock('@/ds/components/Button/Button', () => ({
  Button: ({
    href,
    children,
    onClick,
  }: {
    href?: string
    children: ReactNode
    onClick?: () => void
  }) =>
    href !== undefined ? (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    ) : (
      <button onClick={onClick}>{children}</button>
    ),
}))

vi.mock('@/telemetry/track', () => ({
  track: vi.fn(),
}))

const PDF_AVAILABLE = { available: true, href: '/resume/j-galenti-resume.pdf' }
const PDF_UNAVAILABLE = { available: false, href: '/resume/j-galenti-resume.pdf' }

describe('Resume', () => {
  it('renders the name heading', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    expect(screen.getByRole('heading', { name: 'J Galenti', level: 1 })).toBeInTheDocument()
  })

  it('renders the role line', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    expect(screen.getByText('Design technologist')).toBeInTheDocument()
  })

  it('renders the thesis lede', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    expect(screen.getByText(/I architect enterprise-scale design systems/)).toBeInTheDocument()
  })

  it('renders the Highlights section heading', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    expect(screen.getByRole('heading', { name: /Highlights/i })).toBeInTheDocument()
  })

  it('renders the system proof link', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    const link = screen.getByRole('link', { name: 'See the system →' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/system')
  })

  it('renders the colophon proof link', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    const link = screen.getByRole('link', { name: 'See the craft bar →' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/colophon')
  })

  it('renders the PDF download button when pdf is available', () => {
    render(<Resume pdf={PDF_AVAILABLE} />)
    const link = screen.getByRole('link', { name: 'Download the PDF' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/resume/j-galenti-resume.pdf')
  })

  it('renders the PDF unavailable panel when pdf is not available', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    expect(screen.getByText(/The designed PDF is in production/)).toBeInTheDocument()
  })

  it('renders a back link to /work', () => {
    render(<Resume pdf={PDF_UNAVAILABLE} />)
    const link = screen.getByRole('link', { name: /Back to the work/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work')
  })
})
