/**
 * Unit tests for the reveal fx module (mount/destroy contract).
 *
 * The invariant under test: content is visible by default — the mount sets
 * the hidden state only for elements outside the viewport, and destroy (or
 * reveal completion) hands styles back to the cascade.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountReveal } from './reveal'

// ── IntersectionObserver stub ────────────────────────────────────────────────

let ioCallback: IntersectionObserverCallback | null = null
const ioObserve = vi.fn()
const ioUnobserve = vi.fn()
const ioDisconnect = vi.fn()

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb
  }
  observe = ioObserve
  unobserve = ioUnobserve
  disconnect = ioDisconnect
}

function intersect(targets: Element[]): void {
  ioCallback?.(
    targets.map((target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry),
    {} as unknown as IntersectionObserver,
  )
}

// ── DOM helpers ──────────────────────────────────────────────────────────────

/** A container child whose viewport position is stubbed (jsdom has no layout). */
function addChild(container: HTMLElement, top: number): HTMLElement {
  const el = document.createElement('article')
  el.getBoundingClientRect = () =>
    ({ top, bottom: top + 200, left: 0, width: 400, height: 200 }) as DOMRect
  container.appendChild(el)
  return el
}

function makeContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  document.body.innerHTML = ''
  ioCallback = null
  ioObserve.mockClear()
  ioUnobserve.mockClear()
  ioDisconnect.mockClear()
  vi.unstubAllGlobals()
})

describe('mountReveal', () => {
  it('hides only elements below the viewport; on-screen content stays untouched', () => {
    const container = makeContainer()
    const onscreen = addChild(container, 100)
    const offscreen = addChild(container, 2000)

    mountReveal(container)

    expect(onscreen.style.opacity).toBe('')
    expect(onscreen.style.transform).toBe('')
    expect(offscreen.style.opacity).toBe('0')
    expect(offscreen.style.transform).not.toBe('')

    expect(ioObserve).toHaveBeenCalledTimes(1)
    expect(ioObserve).toHaveBeenCalledWith(offscreen)
  })

  it('reveals on scroll-enter and returns styles to the cascade when settled', async () => {
    const container = makeContainer()
    const offscreen = addChild(container, 2000)

    mountReveal(container)
    intersect([offscreen])

    // clearProps fires at tween completion — the settled element carries no
    // inline styles at all, exactly like the no-JS base render.
    await vi.waitFor(() => expect(offscreen.style.opacity).toBe(''), { timeout: 3000 })
    expect(offscreen.style.transform).toBe('')
    expect(ioUnobserve).toHaveBeenCalledWith(offscreen)
  })

  it('reveals each element once — a second entry does not re-hide or re-tween', async () => {
    const container = makeContainer()
    const offscreen = addChild(container, 2000)

    mountReveal(container)
    intersect([offscreen])
    await vi.waitFor(() => expect(offscreen.style.opacity).toBe(''), { timeout: 3000 })

    intersect([offscreen])
    expect(offscreen.style.opacity).toBe('')
  })

  it('honors the selector option', () => {
    const container = makeContainer()
    const marked = addChild(container, 2000)
    marked.setAttribute('data-reveal', '')
    const unmarked = addChild(container, 2400)

    mountReveal(container, { selector: '[data-reveal]' })

    expect(marked.style.opacity).toBe('0')
    expect(unmarked.style.opacity).toBe('')
  })

  it('destroy() mid-flight clears hidden state and disconnects the observer', () => {
    const container = makeContainer()
    const offscreen = addChild(container, 2000)

    const handle = mountReveal(container)
    expect(offscreen.style.opacity).toBe('0')

    handle.destroy()

    expect(offscreen.style.opacity).toBe('')
    expect(offscreen.style.transform).toBe('')
    expect(ioDisconnect).toHaveBeenCalled()

    expect(() => handle.destroy()).not.toThrow()
  })

  it('is inert when every target is already on screen', () => {
    const container = makeContainer()
    addChild(container, 100)
    addChild(container, 400)

    const handle = mountReveal(container)

    expect(ioObserve).not.toHaveBeenCalled()
    expect(() => handle.destroy()).not.toThrow()
  })
})
