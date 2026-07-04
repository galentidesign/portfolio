import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './index'

// Head requires the Inertia runtime; the rendered <title> is covered by e2e.
vi.mock('@inertiajs/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@inertiajs/react')>()),
  Head: () => null,
}))

describe('Home', () => {
  it('renders the greeting', () => {
    render(<Home greeting="Hello, world" />)
    expect(screen.getByRole('heading', { name: 'Hello, world' })).toBeInTheDocument()
  })
})
