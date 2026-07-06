import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PatternGallery } from './PatternGallery'

describe('PatternGallery', () => {
  it('renders the gallery container', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-testid="pattern-gallery"]')).toBeInTheDocument()
  })

  it('renders five pattern figures', () => {
    const { container } = render(<PatternGallery />)
    const figures = container.querySelectorAll('figure')
    expect(figures).toHaveLength(5)
  })

  it('marks every exhibit as inert', () => {
    const { container } = render(<PatternGallery />)
    const exhibits = container.querySelectorAll('[data-exhibit]')
    expect(exhibits).toHaveLength(5)
    for (const exhibit of exhibits) {
      expect(exhibit).toHaveAttribute('inert')
    }
  })

  it('renders the inline validation pattern exhibit', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-exhibit="validation"]')).toBeInTheDocument()
  })

  it('renders the submission pattern exhibit', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-exhibit="submission"]')).toBeInTheDocument()
  })

  it('renders the status badge pattern exhibit', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-exhibit="badges"]')).toBeInTheDocument()
  })

  it('renders the tabular data pattern exhibit', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-exhibit="table"]')).toBeInTheDocument()
  })

  it('renders the feedback toast pattern exhibit', () => {
    const { container } = render(<PatternGallery />)
    expect(container.querySelector('[data-exhibit="toast"]')).toBeInTheDocument()
  })

  it('renders a figcaption label for every figure', () => {
    render(<PatternGallery />)
    expect(screen.getByText('Inline validation pattern')).toBeInTheDocument()
    expect(screen.getByText('Submission pattern')).toBeInTheDocument()
    expect(screen.getByText('Status badge pattern')).toBeInTheDocument()
    expect(screen.getByText('Tabular data pattern')).toBeInTheDocument()
    expect(screen.getByText('Feedback toast pattern')).toBeInTheDocument()
  })
})
