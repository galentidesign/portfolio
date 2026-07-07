/**
 * Unit tests for the proximity glow fx module (mount/destroy contract).
 *
 * jsdom does not implement IntersectionObserver — a class-based stub captures
 * the callback so tests can simulate enter/leave (pattern from
 * story/prologue/PrologueBeat.test.tsx).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountProximityGlow } from './proximityGlow'

const realMatchMedia = window.matchMedia

function stubFinePointer(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    ...realMatchMedia(query),
    matches,
  }))
}

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

function makeTarget(): HTMLElement {
  const el = document.createElement('a')
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
  document.body.appendChild(el)
  return el
}

function pointerMove(x: number, y: number): void {
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }))
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

describe('mountProximityGlow', () => {
  it('is a no-op on coarse pointers — no attribute, no observer', () => {
    stubFinePointer(false)
    const el = makeTarget()

    const handle = mountProximityGlow(el)

    expect(el.hasAttribute('data-fx-glow')).toBe(false)
    expect(ioObserve).not.toHaveBeenCalled()
    expect(() => handle.destroy()).not.toThrow()
  })

  it('marks the element [data-fx-glow] and observes it', () => {
    stubFinePointer(true)
    const el = makeTarget()

    mountProximityGlow(el)

    expect(el.hasAttribute('data-fx-glow')).toBe(true)
    expect(ioObserve).toHaveBeenCalledWith(el)
  })

  it('attaches the pointermove listener only while intersecting', () => {
    stubFinePointer(true)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const el = makeTarget()

    mountProximityGlow(el)
    expect(addSpy).not.toHaveBeenCalledWith('pointermove', expect.anything(), expect.anything())

    intersect(true)
    expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true })

    intersect(false)
    const attached = addSpy.mock.calls.find(([type]) => type === 'pointermove')![1]
    expect(removeSpy).toHaveBeenCalledWith('pointermove', attached)
  })

  it('writes --glow-x/--glow-y percents and --glow-a proximity alpha', () => {
    stubFinePointer(true)
    const el = makeTarget() // 200×100 at (0,0)

    mountProximityGlow(el)
    intersect(true)
    pointerMove(50, 50) // inside the element

    expect(el.style.getPropertyValue('--glow-x')).toBe('25%')
    expect(el.style.getPropertyValue('--glow-y')).toBe('50%')
    expect(el.style.getPropertyValue('--glow-a')).toBe('1')
  })

  it('fades --glow-a with distance and zeroes it on leave', () => {
    stubFinePointer(true)
    const el = makeTarget()

    mountProximityGlow(el)
    intersect(true)
    pointerMove(280, 50) // 80px past the right edge, inside the 160px reach

    const a = Number(el.style.getPropertyValue('--glow-a'))
    expect(a).toBeGreaterThan(0)
    expect(a).toBeLessThan(1)

    intersect(false)
    expect(el.style.getPropertyValue('--glow-a')).toBe('0')
  })

  it('destroy() removes the attribute, custom props, listener, and observer', () => {
    stubFinePointer(true)
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const el = makeTarget()

    const handle = mountProximityGlow(el)
    intersect(true)
    pointerMove(50, 50)

    handle.destroy()

    expect(el.hasAttribute('data-fx-glow')).toBe(false)
    expect(el.style.getPropertyValue('--glow-x')).toBe('')
    expect(el.style.getPropertyValue('--glow-y')).toBe('')
    expect(el.style.getPropertyValue('--glow-a')).toBe('')
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(ioDisconnect).toHaveBeenCalled()

    expect(() => handle.destroy()).not.toThrow()
  })
})
