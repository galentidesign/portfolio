import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './Skeleton'
import styles from './styles.module.css'

// ---------------------------------------------------------------------------
// aria-hidden
// ---------------------------------------------------------------------------

describe('Skeleton aria-hidden', () => {
  it('root has aria-hidden="true" by default', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it.each(['text', 'block', 'circle'] as const)(
    'root has aria-hidden="true" for shape=%s',
    (shape) => {
      const { container } = render(<Skeleton shape={shape} />)
      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    },
  )
})

// ---------------------------------------------------------------------------
// data-shape attribute
// ---------------------------------------------------------------------------

describe('Skeleton data-shape', () => {
  it('defaults to data-shape="text"', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('[data-shape="text"]')
    expect(skeleton).toBeInTheDocument()
  })

  it.each(['text', 'block', 'circle'] as const)('applies data-shape="%s"', (shape) => {
    const { container } = render(<Skeleton shape={shape} />)
    const skeleton = container.querySelector(`[data-shape="${shape}"]`)
    expect(skeleton).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Text shape — lines
// ---------------------------------------------------------------------------

describe('Skeleton text shape', () => {
  it('renders 3 bars by default', () => {
    const { container } = render(<Skeleton shape="text" />)
    const bars = container.querySelectorAll(`.${styles.bar}`)
    expect(bars.length).toBe(3)
  })

  it('renders custom number of lines', () => {
    const { container } = render(<Skeleton shape="text" lines={5} />)
    const bars = container.querySelectorAll(`.${styles.bar}`)
    expect(bars.length).toBe(5)
  })

  it('renders 1 line when lines=1', () => {
    const { container } = render(<Skeleton shape="text" lines={1} />)
    const bars = container.querySelectorAll(`.${styles.bar}`)
    expect(bars.length).toBe(1)
  })

  it('sets last bar width to 60%', () => {
    const { container } = render(<Skeleton shape="text" lines={3} />)
    const bars = container.querySelectorAll(`.${styles.bar}`)
    const lastBar = bars[bars.length - 1] as HTMLElement
    expect(lastBar).toHaveStyle('width: 60%')
  })

  it('does not set width on non-last bars', () => {
    const { container } = render(<Skeleton shape="text" lines={3} />)
    const bars = container.querySelectorAll(`.${styles.bar}`)
    const firstBar = bars[0] as HTMLElement
    expect(firstBar.style.width).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Block shape — dimensions
// ---------------------------------------------------------------------------

describe('Skeleton block shape', () => {
  it('applies default width and height', () => {
    const { container } = render(<Skeleton shape="block" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="block"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('width: 100%')
    expect(skeleton).toHaveStyle('height: 6rem')
  })

  it('applies custom width', () => {
    const { container } = render(<Skeleton shape="block" width="12rem" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="block"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('width: 12rem')
  })

  it('applies custom height', () => {
    const { container } = render(<Skeleton shape="block" height="8rem" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="block"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('height: 8rem')
  })

  it('applies both custom width and height', () => {
    const { container } = render(<Skeleton shape="block" width="20rem" height="10rem" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="block"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('width: 20rem')
    expect(skeleton).toHaveStyle('height: 10rem')
  })
})

// ---------------------------------------------------------------------------
// Circle shape — dimensions
// ---------------------------------------------------------------------------

describe('Skeleton circle shape', () => {
  it('applies default dimension (3rem)', () => {
    const { container } = render(<Skeleton shape="circle" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="circle"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('width: 3rem')
    expect(skeleton).toHaveStyle('height: 3rem')
  })

  it('applies custom width as both width and height', () => {
    const { container } = render(<Skeleton shape="circle" width="5rem" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="circle"]`,
    ) as HTMLElement
    expect(skeleton).toHaveStyle('width: 5rem')
    expect(skeleton).toHaveStyle('height: 5rem')
  })

  it('ignores height prop for circle shape', () => {
    const { container } = render(<Skeleton shape="circle" height="10rem" />)
    const skeleton = container.querySelector(
      `.${styles.skeleton}[data-shape="circle"]`,
    ) as HTMLElement
    // Width should be default (3rem), height should match width
    expect(skeleton).toHaveStyle('width: 3rem')
    expect(skeleton).toHaveStyle('height: 3rem')
  })
})
