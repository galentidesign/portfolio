import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

// Mock Inertia so the page can render in isolation.
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

// Mock the dynamic import so it never resolves during the synchronous tests
// (the page should show the pending placeholder, not the demo component).
vi.mock('@/studies/polaris-demo/PolarisDemo', () => ({
  default: () => <div data-testid="polaris-demo-loaded">Demo loaded</div>,
}))

// Import after mocks.
const { default: ShadcnToPolarisDemo } = await import('./shadcn-to-polaris-demo')

describe('ShadcnToPolarisDemo page', () => {
  it('renders the page heading', () => {
    render(<ShadcnToPolarisDemo />)
    expect(screen.getByRole('heading', { name: 'Polaris Chores — live demo' })).toBeInTheDocument()
  })

  it('renders the state switcher before the chunk loads', () => {
    render(<ShadcnToPolarisDemo />)
    expect(screen.getByTestId('demo-state-switcher')).toBeInTheDocument()
  })

  it('renders all four state options in the switcher', () => {
    render(<ShadcnToPolarisDemo />)
    expect(screen.getByRole('radio', { name: 'success' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'loading' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'empty' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'error' })).toBeInTheDocument()
  })

  it('defaults to "success" state selected', () => {
    render(<ShadcnToPolarisDemo />)
    const successRadio = screen.getByRole('radio', { name: 'success' }) as HTMLInputElement
    expect(successRadio.checked).toBe(true)
  })

  it('renders a pending placeholder before the Polaris chunk loads', () => {
    render(<ShadcnToPolarisDemo />)
    // Before the dynamic import resolves, the placeholder should be visible.
    // The vi.mock for PolarisDemo does not auto-resolve in synchronous render.
    expect(screen.getByText('Loading Polaris demo…')).toBeInTheDocument()
  })

  it('renders a back link to the study page', () => {
    render(<ShadcnToPolarisDemo />)
    const link = screen.getByRole('link', { name: /Back to the study/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/work/shadcn-to-polaris')
  })
})
