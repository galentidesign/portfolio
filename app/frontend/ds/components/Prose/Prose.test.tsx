import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import styles from './styles.module.css'
import { Prose } from './Prose'

// ---------------------------------------------------------------------------
// Renders children inside .prose root
// ---------------------------------------------------------------------------

describe('Prose render', () => {
  it('renders children inside the .prose root', () => {
    render(
      <Prose>
        <h1>Hello</h1>
        <p>World</p>
      </Prose>,
    )
    const heading = screen.getByRole('heading', { name: 'Hello' })
    expect(heading.tagName).toBe('H1')
  })
})

// ---------------------------------------------------------------------------
// Ref
// ---------------------------------------------------------------------------

describe('Prose ref', () => {
  it('forwards ref to the root div', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Prose ref={ref}>
        <p>Content</p>
      </Prose>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})

// ---------------------------------------------------------------------------
// Container class
// ---------------------------------------------------------------------------

describe('Prose container', () => {
  it('has the prose class on the root container', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Prose ref={ref}>
        <p>Content</p>
      </Prose>,
    )
    expect(ref.current).toHaveClass(styles.prose)
  })
})
