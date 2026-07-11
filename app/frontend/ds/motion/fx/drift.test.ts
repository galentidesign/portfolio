/**
 * Unit tests for the drift fx module (mount/destroy contract).
 *
 * jsdom has no layout (host rect 0×0) — the tick guards on that, so these
 * tests pin the DOM contract (holder, motes, deterministic inline styles)
 * and the ticker lifecycle via the IntersectionObserver stub, like marquee.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { mountDrift } from './drift'

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

function makeHost(): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  return host
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

describe('mountDrift', () => {
  it('mounts an aria-hidden holder with the preset mote count', () => {
    const host = makeHost()

    mountDrift(host)

    const holder = host.querySelector('[data-fx-drift]')
    expect(holder).not.toBeNull()
    expect(holder).toHaveAttribute('aria-hidden', 'true')
    expect(holder?.getAttribute('data-fx-drift')).toBe('bone')
    expect(host.querySelectorAll('[data-drift-mote]').length).toBe(9)
  })

  it('scales the ember preset and honours a count override', () => {
    const host = makeHost()

    mountDrift(host, { preset: 'ember', count: 5 })

    expect(host.querySelector('[data-fx-drift]')?.getAttribute('data-fx-drift')).toBe('ember')
    expect(host.querySelectorAll('[data-drift-mote]').length).toBe(5)
  })

  it('styles motes inline off semantic tokens — deterministic per index', () => {
    const host = makeHost()

    mountDrift(host)

    const motes = Array.from(host.querySelectorAll<HTMLElement>('[data-drift-mote]'))
    expect(motes[0].style.backgroundColor).toContain('var(--color-line-strong)')
    expect(motes[1].style.backgroundColor).toContain('var(--color-accent-muted)')
    expect(motes[0].style.pointerEvents).toBe('')
    const holder = host.querySelector<HTMLElement>('[data-fx-drift]')!
    expect(holder.style.pointerEvents).toBe('none')
    // Re-mounting yields identical assignments (index math, no randomness).
    const secondHost = makeHost()
    mountDrift(secondHost)
    const again = Array.from(secondHost.querySelectorAll<HTMLElement>('[data-drift-mote]'))
    motes.forEach((m, i) => expect(again[i].style.cssText).toBe(m.style.cssText))
  })

  it('runs the ticker only while on screen', () => {
    const tickerAdd = vi.spyOn(gsap.ticker, 'add')
    const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
    const host = makeHost()

    mountDrift(host)
    expect(tickerAdd).not.toHaveBeenCalled()

    intersect(true)
    expect(tickerAdd).toHaveBeenCalledTimes(1)

    intersect(false)
    expect(tickerRemove).toHaveBeenCalledWith(tickerAdd.mock.calls[0][0])
  })

  it('destroy() removes the holder, observer, listeners, and ticker', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
    const host = makeHost()

    const handle = mountDrift(host)
    intersect(true)

    handle.destroy()

    expect(host.querySelector('[data-fx-drift]')).toBeNull()
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(ioDisconnect).toHaveBeenCalled()
    expect(tickerRemove).toHaveBeenCalled()

    expect(() => handle.destroy()).not.toThrow()
  })
})
