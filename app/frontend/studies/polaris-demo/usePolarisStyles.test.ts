import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock the ?inline CSS import — vite resolves this at build time, not in vitest.
vi.mock('@shopify/polaris/build/esm/styles.css?inline', () => ({
  default: '.polaris-stub { color: red; }',
}))

// Import after mocks are established.
const { usePolarisStyles } = await import('./usePolarisStyles')

const ATTR = 'data-polaris-demo-styles'
const SITE_GUARD_SENTINEL = 'html[data-skin]'

beforeEach(() => {
  // Remove any leftover style elements between tests.
  document.head.querySelectorAll(`style[${ATTR}]`).forEach((el) => el.remove())
})

describe('usePolarisStyles', () => {
  it('injects a <style data-polaris-demo-styles> element on mount', () => {
    renderHook(() => usePolarisStyles())

    const el = document.head.querySelector(`style[${ATTR}]`)
    expect(el).not.toBeNull()
  })

  it('injects the polaris CSS stub content', () => {
    renderHook(() => usePolarisStyles())

    const el = document.head.querySelector(`style[${ATTR}]`)
    expect(el?.textContent).toContain('.polaris-stub')
  })

  it('injects the SITE_GUARD block verbatim', () => {
    renderHook(() => usePolarisStyles())

    const el = document.head.querySelector(`style[${ATTR}]`)
    expect(el?.textContent).toContain(SITE_GUARD_SENTINEL)
    expect(el?.textContent).toContain('font-size: 100%')
    expect(el?.textContent).toContain('color: var(--color-ink)')
  })

  it('removes the <style> element on unmount', () => {
    const { unmount } = renderHook(() => usePolarisStyles())

    expect(document.head.querySelector(`style[${ATTR}]`)).not.toBeNull()

    unmount()

    expect(document.head.querySelector(`style[${ATTR}]`)).toBeNull()
  })

  it('does not inject a duplicate element if already mounted', () => {
    const { unmount: u1 } = renderHook(() => usePolarisStyles())
    renderHook(() => usePolarisStyles())

    const elements = document.head.querySelectorAll(`style[${ATTR}]`)
    expect(elements.length).toBe(1)

    u1()
  })
})
