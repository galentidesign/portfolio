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
 *
 * jsdom resolves no custom properties, so the module runs on its fallback
 * travel duration/ease — the swap beat lands at ~0.55s of a ~1.1s travel.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountRethemeMotion } from './motion'

// ---------------------------------------------------------------------------
// DOM helpers — mirror the EraRetheme band + grouped stagger markup
// ---------------------------------------------------------------------------

function makeContainer(staggerGroups: readonly string[] = []): HTMLElement {
  const container = document.createElement('div')
  const staggerEls = staggerGroups
    .map((group) =>
      group === ''
        ? '<section data-retheme-stagger></section>'
        : `<section data-retheme-stagger="${group}"></section>`,
    )
    .join('')
  container.innerHTML = `
    <div aria-hidden="true" data-retheme-band>
      <div data-skin="rails-era" data-zone="night">
        <p>
          <span data-retheme-caption-char>2</span>
          <span data-retheme-caption-char>0</span>
          <span data-retheme-caption-char>1</span>
          <span data-retheme-caption-char>4</span>
        </p>
      </div>
    </div>
    ${staggerEls}
  `
  document.body.appendChild(container)
  return container
}

function getBand(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-retheme-band]')
  if (!el) throw new Error('missing [data-retheme-band]')
  return el
}

function getCaptionChars(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-retheme-caption-char]'))
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
    const container = makeContainer(['type', 'surface'])
    const onSwap = vi.fn()
    mountRethemeMotion(container, { onSwap })

    // Wait for GSAP's ticker to advance the playhead past the swap beat
    // (~0.55s on the fallback travel). jsdom provides requestAnimationFrame;
    // vi.waitFor polls until the assertion passes within the timeout.
    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })

    // Confirm no second fire after a further short wait.
    await new Promise<void>((r) => setTimeout(r, 100))
    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  it('fires onSwap exactly once with zero stagger targets (timeline still runs)', async () => {
    const container = makeContainer([])
    const onSwap = vi.fn()
    mountRethemeMotion(container, { onSwap })

    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  // -- before-states ----------------------------------------------------------

  it('hides the caption characters up front so the type-out can reveal them', () => {
    const container = makeContainer()
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })

    getCaptionChars(container).forEach((el) => expect(el.style.opacity).toBe('0'))
    handle.destroy()
  })

  // -- destroy() mid-flight --------------------------------------------------

  it('destroy() mid-flight does not throw and does not invoke onSwap', () => {
    // Immediately after mount, the GSAP ticker has not advanced past the swap
    // beat — the swap callback is pending. Destroying synchronously must
    // kill the timeline without firing the callback.
    const container = makeContainer(['type', 'surface'])
    const onSwap = vi.fn()
    const handle = mountRethemeMotion(container, { onSwap })

    expect(() => handle.destroy()).not.toThrow()
    expect(onSwap).not.toHaveBeenCalled()
  })

  // -- destroy() idempotency -------------------------------------------------

  it('destroy() is idempotent — calling twice never throws', () => {
    const container = makeContainer(['type'])
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })

    expect(() => {
      handle.destroy()
      handle.destroy()
    }).not.toThrow()
  })

  // -- destroy() clearProps --------------------------------------------------

  it('destroy() clears all inline styles on the band element', () => {
    const container = makeContainer([])
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })
    const el = getBand(container)

    // GSAP applied the before-state via gsap.set (opacity: 0, y) — verify the
    // inline style is present before destroy.
    expect(el.style.opacity).not.toBe('')

    handle.destroy()

    expect(el.style.opacity).toBe('')
    expect(el.style.transform).toBe('')
  })

  it('destroy() clears all inline styles on caption characters', () => {
    const container = makeContainer([])
    const handle = mountRethemeMotion(container, { onSwap: vi.fn() })
    const chars = getCaptionChars(container)

    chars.forEach((el) => expect(el.style.opacity).not.toBe(''))

    handle.destroy()

    chars.forEach((el) => expect(el.style.opacity).toBe(''))
  })

  it('destroy() clears all inline styles on stagger targets (grouped and bare)', () => {
    const container = makeContainer(['chrome', 'type', 'surface', ''])
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

  it('destroy() after the swap also kills the settle cascade and clears its styles', async () => {
    const container = makeContainer(['surface', 'chrome'])
    const onSwap = vi.fn()
    const handle = mountRethemeMotion(container, { onSwap })

    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })

    // The settle cascade is live (or pending via its delayed call) — destroy
    // must kill it and leave the targets base-styled.
    handle.destroy()

    getStaggerTargets(container).forEach((el) => {
      expect(el.style.opacity).toBe('')
      expect(el.style.transform).toBe('')
    })

    // Still exactly one call — destroy must not re-fire the swap.
    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  it('destroy() after timeline completion does not call onSwap again', async () => {
    const container = makeContainer([])
    const onSwap = vi.fn()
    const handle = mountRethemeMotion(container, { onSwap })

    await vi.waitFor(() => expect(onSwap).toHaveBeenCalledTimes(1), { timeout: 3000 })

    handle.destroy()

    // Still exactly one call — destroy must not re-fire the swap.
    expect(onSwap).toHaveBeenCalledTimes(1)
  })
})
