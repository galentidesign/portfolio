/**
 * Unit tests for the glyphPlay fx module (mount/tick/destroy contract).
 *
 * jsdom has no layout, so the width lock is skipped (degenerate-width guard,
 * like marquee); the weight breathing itself runs on the real gsap ticker
 * once the IntersectionObserver stub reports the wordmark on screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { gsap } from 'gsap'
import { mountGlyphPlay } from './glyphPlay'

// ── IntersectionObserver stub ────────────────────────────────────────────────

let ioCallback: IntersectionObserverCallback | null = null
const ioObserve = vi.fn()
const ioDisconnect = vi.fn()

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb
  }
  observe = ioObserve
  unobserve = vi.fn()
  disconnect = ioDisconnect
}

function intersect(isIntersecting: boolean): void {
  ioCallback?.(
    [{ isIntersecting } as IntersectionObserverEntry],
    {} as unknown as IntersectionObserver,
  )
}

function makeWordmark(word = 'GALENTI'): HTMLElement {
  const el = document.createElement('div')
  for (const letter of word) {
    const span = document.createElement('span')
    span.dataset.glyph = ''
    span.textContent = letter
    el.appendChild(span)
  }
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  document.body.innerHTML = ''
  ioCallback = null
  ioObserve.mockClear()
  ioDisconnect.mockClear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('mountGlyphPlay', () => {
  it('breathes exactly two deterministic glyphs once on screen', async () => {
    const el = makeWordmark()

    mountGlyphPlay(el)
    intersect(true)

    // GALENTI (7 glyphs) → picks at floor(7·0.42)=2 and floor(7·0.72)=5.
    await waitFor(() => {
      const glyphs = el.querySelectorAll<HTMLElement>('[data-glyph]')
      expect(glyphs[2].style.getPropertyValue('font-variation-settings')).toContain('wght')
      expect(glyphs[5].style.getPropertyValue('font-variation-settings')).toContain('wght')
    })
    const untouched = [0, 1, 3, 4, 6]
    const glyphs = el.querySelectorAll<HTMLElement>('[data-glyph]')
    untouched.forEach((i) =>
      expect(glyphs[i].style.getPropertyValue('font-variation-settings')).toBe(''),
    )
  })

  it('keeps the weight inside the variable axis range', async () => {
    const el = makeWordmark()

    mountGlyphPlay(el, { amplitude: 2000, period: 0.05 })
    intersect(true)

    await waitFor(() => {
      const value = el
        .querySelectorAll<HTMLElement>('[data-glyph]')[2]
        .style.getPropertyValue('font-variation-settings')
      expect(value).toContain('wght')
      const weight = Number.parseInt(value.replace(/[^0-9]/g, ''), 10)
      expect(weight).toBeGreaterThanOrEqual(100)
      expect(weight).toBeLessThanOrEqual(900)
    })
  })

  it('runs the ticker only while on screen', () => {
    const tickerAdd = vi.spyOn(gsap.ticker, 'add')
    const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
    const el = makeWordmark()

    mountGlyphPlay(el)
    expect(tickerAdd).not.toHaveBeenCalled()

    intersect(true)
    expect(tickerAdd).toHaveBeenCalledTimes(1)

    intersect(false)
    expect(tickerRemove).toHaveBeenCalledWith(tickerAdd.mock.calls[0][0])
  })

  it('destroy() clears the inline weights, observer, listeners, and ticker', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const el = makeWordmark()

    const handle = mountGlyphPlay(el)
    intersect(true)
    await waitFor(() =>
      expect(
        el
          .querySelectorAll<HTMLElement>('[data-glyph]')[2]
          .style.getPropertyValue('font-variation-settings'),
      ).toContain('wght'),
    )

    handle.destroy()

    const glyphs = el.querySelectorAll<HTMLElement>('[data-glyph]')
    Array.from(glyphs).forEach((g) =>
      expect(g.style.getPropertyValue('font-variation-settings')).toBe(''),
    )
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(ioDisconnect).toHaveBeenCalled()

    expect(() => handle.destroy()).not.toThrow()
  })

  it('declines an element with no glyphs', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    const handle = mountGlyphPlay(el)

    expect(ioObserve).not.toHaveBeenCalled()
    expect(() => handle.destroy()).not.toThrow()
  })
})
