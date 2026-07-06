import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SiteFooter } from './SiteFooter'
import { CONTACT_EMAIL, LINKEDIN_URL, SOURCE_URL } from './contact'

describe('SiteFooter', () => {
  it('renders as a contentinfo landmark', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('carries the §6.8 contact trio plus colophon', () => {
    render(<SiteFooter />)

    expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
      'href',
      `mailto:${CONTACT_EMAIL}`,
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', LINKEDIN_URL)
    expect(screen.getByRole('link', { name: 'Source' })).toHaveAttribute('href', SOURCE_URL)
    expect(screen.getByRole('link', { name: 'Colophon' })).toHaveAttribute('href', '/colophon')
  })

  it('opens external links in a new tab with rel=noreferrer', () => {
    render(<SiteFooter />)

    for (const name of ['LinkedIn', 'Source']) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
  })
})
