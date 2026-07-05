/**
 * Unit tests for the retheme motion layer (story/retheme/motion.ts).
 *
 * Testing idiom follows story/assembly/motion/motion.test.ts:
 * - Real GSAP (gsap core only — no ScrollTrigger mock needed; none imported).
 * - Synchronous assertions for structural / inline-style checks.
 * - vi.waitFor for assertions that require the GSAP ticker to advance (onSwap
 *   timing), following the pattern established in EraRetheme.test.tsx.
 *
 * No ScrollTrigger: this module is gsap core only. The test file itself never
 * imports ScrollTrigger as an additional guarantee.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountRethemeMotion } from './motion'

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function makeContainer(staggerCount = 0): HTMLElement {
  const container = document.createElement('div')
  const staggerEls = Array.from(
    { length: staggerCount },
    () => '<section data-retheme-stagger></section>',
  ).join('')
  container.innerHTML = `
    <span aria-hidden="true" data-retheme-sweep></span>
    ${staggerEls}
  `
  document.body.appendChild(container)
  return container
}

function getSweep(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-retheme-sweep]')
  if (!el) throw new Error('missing [data-retheme-sweep]')
  return el
}

function getStaggerTargets(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-retheme-stagger]'))
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mountRethemeMotion', () => {
  it('returns a handle with a destroy() method', () => {
    const container = makeContainer()
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })
    expect(typeof handle.destroy).toBe('function')
    handle.destroy()
  })

  // -- onSwap exactly-once guarantee ----------------------------------------

  it('fires onSwap exactly once when the timeline plays through (with stagger targets)', async () => {
    const container = makeContainer(2)
    const onSwap = vi.fn()
    mountRethemeMotion(container, { onSwap })

    // Wait for GSAP's ticker to advance the playhead past SWAP_AT (~140ms).
    // jsdom provides requestAnimationFrame; vi.waitFor polls until the
    // assertion passes within the timeout.
    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })

    // Confirm no second fire after a further short wait.
    await new Promise<void>((r) => setTimeout(r, 100))
    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  it('fires onSwap exactly once with zero stagger targets (timeline still runs)', async () => {
    const container = makeContainer(0)
    const onSwap = vi.fn()
    mountRethemeMotion(container, { onSwap })

    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  // -- destroy() mid-flight --------------------------------------------------

  it('destroy() mid-flight does not throw and does not invoke onSwap', () => {
    // Immediately after mount, the GSAP ticker has not advanced past SWAP_AT
    // (~0.14s) — the swap callback is pending. Destroying synchronously must
    // kill the timeline without firing the callback.
    const container = makeContainer(2)
    const onSwap = vi.fn()
    const handle = mountRethemeMotion(container, { onSwap })

    expect(() => handle.destroy()).not.toThrow()
    expect(onSwap).not.toHaveBeenCalled()
  })

  // -- destroy() idempotency -------------------------------------------------

  it('destroy() is idempotent — calling twice never throws', () => {
    const container = makeContainer(1)
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })

    expect(() => {
      handle.destroy()
      handle.destroy()
    }).not.toThrow()
  })

  // -- destroy() clearProps --------------------------------------------------

  it('destroy() clears all inline styles on the sweep element', () => {
    const container = makeContainer(0)
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })
    const el = getSweep(container)

    // GSAP applied the before-state via gsap.set (opacity: 0) — verify the
    // inline style is present before destroy.
    expect(el.style.opacity).not.toBe('')

    handle.destroy()

    expect(el.style.opacity).toBe('')
    expect(el.style.transform).toBe('')
  })

  it('destroy() clears all inline styles on stagger targets', () => {
    const container = makeContainer(3)
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })
    const targets = getStaggerTargets(container)

    // GSAP applied before-states via gsap.set (y: 8, opacity: 0.85).
    targets.forEach((el) => expect(el.style.opacity).not.toBe(''))

    handle.destroy()

    targets.forEach((el) => {
      expect(el.style.opacity).toBe('')
      expect(el.style.transform).toBe('')
    })
  })

  it('destroy() after timeline completion does not call onSwap again', async () => {
    const container = makeContainer(0)
    const onSwap = vi.fn()
    const handle = mountRethemeMotion(container, { onSwap })

    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })

    handle.destroy()

    // Still exactly one call — destroy must not re-fire the swap.
    expect(onSwap).toHaveBeenCalledTimes(1)
  })
})
