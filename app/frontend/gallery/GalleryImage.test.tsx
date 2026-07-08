import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GalleryImage } from './GalleryImage'

// ---------------------------------------------------------------------------
// Available → real <img>
// ---------------------------------------------------------------------------

describe('GalleryImage — available', () => {
  it('renders a lazy <img> with the src and alt', () => {
    render(<GalleryImage src="/gallery/x/cover.png" alt="A cover" available />)
    const img = screen.getByRole('img', { name: 'A cover' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/gallery/x/cover.png')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('is a button and fires onClick when available + onClick given', () => {
    const onClick = vi.fn()
    render(<GalleryImage src="/gallery/x/s.png" alt="Shot" available onClick={onClick} />)
    const button = screen.getByRole('button', { name: /View full image: Shot/ })
    button.click()
    expect(onClick).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Unavailable → labeled placeholder, never interactive
// ---------------------------------------------------------------------------

describe('GalleryImage — placeholder', () => {
  it('renders a labeled placeholder instead of a broken <img>', () => {
    render(<GalleryImage src="/gallery/x/cover.png" alt="Pending cover" available={false} />)
    expect(screen.queryByRole('img', { name: 'Pending cover' })?.tagName).not.toBe('IMG')
    // The placeholder exposes the alt via role=img aria-label.
    expect(screen.getByRole('img', { name: 'Pending cover' })).toBeInTheDocument()
    expect(screen.getByText('image pending')).toBeInTheDocument()
  })

  it('is never interactive when unavailable, even with onClick', () => {
    const onClick = vi.fn()
    render(<GalleryImage src="/gallery/x/s.png" alt="Shot" available={false} onClick={onClick} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
