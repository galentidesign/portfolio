/**
 * Unit tests for the marquee fx module (mount/destroy contract).
 *
 * jsdom has no layout, so scrollWidth is 0 — the module's degenerate-width
 * guard still appends exactly one aria-hidden clone set, which is what the
 * duplication contract tests care about. Ticker start/stop is asserted via
 * gsap.ticker spies driven by the IntersectionObserver stub.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { mountMarquee } from './marquee'

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

function makeTrack(terms = ['alpha', 'beta', 'gamma']): HTMLElement {
  const track = document.createElement('div')
  for (const term of terms) {
    const span = document.createElement('span')
    span.textContent = term
    track.appendChild(span)
  }
  document.body.appendChild(track)
  return track
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

describe('mountMarquee', () => {
  it('duplicates the track content with aria-hidden clones', () => {
    const track = makeTrack()

    mountMarquee(track)

    expect(track.children.length).toBe(6)
    const originals = Array.from(track.children).slice(0, 3)
    const clones = Array.from(track.children).slice(3)
    originals.forEach((el) => expect(el.hasAttribute('aria-hidden')).toBe(false))
    clones.forEach((el) => expect(el.getAttribute('aria-hidden')).toBe('true'))
    clones.forEach((el, i) => expect(el.textContent).toBe(originals[i].textContent))
  })

  it('observes the track and wires visibilitychange', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const track = makeTrack()

    mountMarquee(track)

    expect(ioObserve).toHaveBeenCalledWith(track)
    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })

  it('runs the ticker only while on screen', () => {
    const tickerAdd = vi.spyOn(gsap.ticker, 'add')
    const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
    const track = makeTrack()

    mountMarquee(track)
    expect(tickerAdd).not.toHaveBeenCalled()

    intersect(true)
    expect(tickerAdd).toHaveBeenCalledTimes(1)

    intersect(false)
    expect(tickerRemove).toHaveBeenCalledWith(tickerAdd.mock.calls[0][0])
  })

  it('destroy() removes clones, listeners, observer, and the ticker', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
    const track = makeTrack()

    const handle = mountMarquee(track)
    intersect(true)

    handle.destroy()

    expect(track.children.length).toBe(3)
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(ioDisconnect).toHaveBeenCalled()
    expect(tickerRemove).toHaveBeenCalled()
    expect(track.style.transform).toBe('')

    expect(() => handle.destroy()).not.toThrow()
  })
})
