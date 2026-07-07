/**
 * Unit tests for the magnetic fx module (mount/destroy contract).
 *
 * Testing idiom follows story/retheme/motion.test.ts: real GSAP core,
 * synchronous assertions for listener wiring, vi.waitFor where the GSAP
 * ticker must advance. jsdom's matchMedia stub reports matches:false, so the
 * fine-pointer gate is opted in per test.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gsap } from 'gsap'
import { mountMagnetic } from './magnetic'

const realMatchMedia = window.matchMedia

function stubFinePointer(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    ...realMatchMedia(query),
    matches,
  }))
}

function makeTarget(rect: Partial<DOMRect>): HTMLElement {
  const el = document.createElement('button')
  el.getBoundingClientRect = () =>
    ({ left: 100, top: 100, width: 100, height: 40, ...rect }) as DOMRect
  document.body.appendChild(el)
  return el
}

function pointerMove(x: number, y: number): void {
  // jsdom has no PointerEvent constructor; MouseEvent carries the same
  // clientX/clientY contract the handler reads.
  window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }))
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('mountMagnetic', () => {
  it('is a no-op on coarse pointers — no window listener, inert destroy', () => {
    stubFinePointer(false)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const el = makeTarget({})

    const handle = mountMagnetic(el)

    expect(addSpy).not.toHaveBeenCalledWith('pointermove', expect.anything(), expect.anything())
    expect(() => handle.destroy()).not.toThrow()
  })

  it('attaches a window pointermove listener on mount and removes it on destroy', () => {
    stubFinePointer(true)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const el = makeTarget({})

    const handle = mountMagnetic(el)
    expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true })

    handle.destroy()
    const attached = addSpy.mock.calls.find(([type]) => type === 'pointermove')![1]
    expect(removeSpy).toHaveBeenCalledWith('pointermove', attached)
  })

  it('leans toward a nearby cursor, never past ±6px', async () => {
    stubFinePointer(true)
    const el = makeTarget({}) // box 100×40 at (100,100); center (150,120)

    mountMagnetic(el)
    pointerMove(170, 120) // over the element, 20px right of center

    await vi.waitFor(() => {
      const x = Number(gsap.getProperty(el, 'x'))
      expect(x).toBeGreaterThan(0)
    })
    const x = Number(gsap.getProperty(el, 'x'))
    const y = Number(gsap.getProperty(el, 'y'))
    expect(Math.abs(x)).toBeLessThanOrEqual(6)
    expect(Math.abs(y)).toBeLessThanOrEqual(6)
  })

  it('ignores a cursor beyond the proximity radius', async () => {
    stubFinePointer(true)
    const el = makeTarget({})

    mountMagnetic(el)
    pointerMove(600, 600) // far outside box + 96px radius

    // Give the ticker a beat — the transform must never engage.
    await new Promise<void>((r) => setTimeout(r, 60))
    expect(el.style.transform).toBe('')
  })

  it('destroy() clears the inline transform and is idempotent', async () => {
    stubFinePointer(true)
    const el = makeTarget({})

    const handle = mountMagnetic(el)
    pointerMove(170, 120)
    await vi.waitFor(() => expect(el.style.transform).not.toBe(''))

    expect(() => {
      handle.destroy()
      handle.destroy()
    }).not.toThrow()
    expect(el.style.transform).toBe('')
  })
})
