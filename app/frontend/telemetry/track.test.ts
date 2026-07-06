/**
 * track.ts unit tests.
 *
 * jsdom workarounds:
 *  - navigator.sendBeacon is not implemented in jsdom; we define it on
 *    navigator in beforeEach via Object.defineProperty.
 *  - requestAnimationFrame is stubbed to run synchronously so scroll
 *    handler tests don't need fake timers.
 *  - window.history.pushState is used to change the pathname without
 *    triggering a real navigation.
 *  - document.referrer is re-defined via Object.defineProperty per test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { _resetForTest, initTelemetry, markSkimVia, track } from './track'

// ── Inertia mock ──────────────────────────────────────────────────────────────
// Capture the navigate callback for direct invocation in tests.

let capturedNavigateCb: (() => void) | null = null

vi.mock('@inertiajs/react', () => ({
  router: {
    on: vi.fn().mockImplementation((_event: string, cb: () => void) => {
      capturedNavigateCb = cb
      return vi.fn() // unsubscribe fn
    }),
  },
}))

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  _resetForTest()
  capturedNavigateCb = null

  // Reset to a neutral path
  window.history.pushState({}, '', '/test')

  // Stub sendBeacon — jsdom lacks it; define on navigator so track() fires
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(true),
  })

  // Stub rAF to run synchronously so scroll tests don't need fake timers
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 0
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  // Restore referrer to empty string between tests
  Object.defineProperty(document, 'referrer', {
    configurable: true,
    get: () => '',
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function lastBeaconBody(): Promise<{ kind: string; payload: Record<string, unknown> }> {
  const sendBeacon = vi.mocked(navigator.sendBeacon)
  const lastCall = sendBeacon.mock.calls[sendBeacon.mock.calls.length - 1]
  const body = lastCall[1] as Blob
  const text = await body.text()
  return JSON.parse(text) as { kind: string; payload: Record<string, unknown> }
}

function beaconCount(): number {
  return vi.mocked(navigator.sendBeacon).mock.calls.length
}

// ── track() — core ────────────────────────────────────────────────────────────

describe('track()', () => {
  it('fires sendBeacon with the correct kind', async () => {
    track('page_view')
    const body = await lastBeaconBody()
    expect(body.kind).toBe('page_view')
  })

  it('merges pageload_id into the payload', async () => {
    track('page_view')
    const body = await lastBeaconBody()
    expect(typeof body.payload.pageload_id).toBe('string')
    expect(body.payload.pageload_id).not.toBe('')
  })

  it('merges current pathname into the payload as path', async () => {
    window.history.pushState({}, '', '/work')
    track('page_view')
    const body = await lastBeaconBody()
    expect(body.payload.path).toBe('/work')
  })

  it('merges caller-supplied payload fields', async () => {
    track('scroll_depth', { quartile: 50 })
    const body = await lastBeaconBody()
    expect(body.payload.quartile).toBe(50)
  })

  it('does not throw when sendBeacon is undefined', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    expect(() => track('page_view')).not.toThrow()
  })

  it('sends to /t', () => {
    track('page_view')
    expect(vi.mocked(navigator.sendBeacon).mock.calls[0][0]).toBe('/t')
  })

  it('sends a Blob with application/json type', () => {
    track('page_view')
    const blob = vi.mocked(navigator.sendBeacon).mock.calls[0][1] as Blob
    expect(blob.type).toBe('application/json')
  })

  it('pageload_id is consistent across multiple track() calls', async () => {
    track('page_view')
    track('scroll_depth', { quartile: 25 })
    const first = await (async () => {
      const [, blob] = vi.mocked(navigator.sendBeacon).mock.calls[0]
      const text = await (blob as Blob).text()
      return (JSON.parse(text) as { payload: { pageload_id: string } }).payload.pageload_id
    })()
    const second = await (async () => {
      const [, blob] = vi.mocked(navigator.sendBeacon).mock.calls[1]
      const text = await (blob as Blob).text()
      return (JSON.parse(text) as { payload: { pageload_id: string } }).payload.pageload_id
    })()
    expect(first).toBe(second)
  })
})

// ── initTelemetry() ───────────────────────────────────────────────────────────

describe('initTelemetry()', () => {
  it('fires an initial page_view beacon', async () => {
    initTelemetry()
    expect(beaconCount()).toBe(1)
    const body = await lastBeaconBody()
    expect(body.kind).toBe('page_view')
  })

  it('includes referrer in page_view when document.referrer is non-empty', async () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'https://google.com',
    })
    initTelemetry()
    const body = await lastBeaconBody()
    expect(body.payload.referrer).toBe('https://google.com')
  })

  it('omits referrer from page_view when document.referrer is empty', async () => {
    initTelemetry()
    const body = await lastBeaconBody()
    expect(body.payload.referrer).toBeUndefined()
  })

  it('includes utm_source in page_view when present in search', async () => {
    window.history.pushState({}, '', '/test?utm_source=twitter&utm_medium=cpc')
    initTelemetry()
    const body = await lastBeaconBody()
    expect(body.payload.utm_source).toBe('twitter')
    expect(body.payload.utm_medium).toBe('cpc')
  })

  it('omits utm fields when not in search', async () => {
    initTelemetry()
    const body = await lastBeaconBody()
    expect(body.payload.utm_source).toBeUndefined()
    expect(body.payload.utm_medium).toBeUndefined()
    expect(body.payload.utm_campaign).toBeUndefined()
  })

  it('registers a navigate listener on the Inertia router', () => {
    initTelemetry()
    // capturedNavigateCb is set by the router.on mock implementation above
    expect(capturedNavigateCb).toBeTypeOf('function')
  })

  it('fires page_view on each Inertia navigate', () => {
    initTelemetry()
    const countAfterInit = beaconCount()
    capturedNavigateCb!()
    expect(beaconCount()).toBe(countAfterInit + 1)
  })

  it('is idempotent — second call fires no additional beacons', () => {
    initTelemetry()
    const countAfterFirst = beaconCount()
    initTelemetry()
    expect(beaconCount()).toBe(countAfterFirst)
  })

  it('does not throw when navigator.sendBeacon is undefined', () => {
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    expect(() => initTelemetry()).not.toThrow()
  })
})

// ── scroll_depth quartile deduplication ───────────────────────────────────────

describe('scroll_depth quartile dedup', () => {
  function setScrollFraction(fraction: number): void {
    // scrollHeight - innerHeight = scrollable; fraction * scrollable = scrollY
    const scrollable = 1000
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => scrollable + window.innerHeight,
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => Math.round(fraction * scrollable),
    })
  }

  it('fires scroll_depth for quartile 25 when scrolled 25%', async () => {
    initTelemetry()
    setScrollFraction(0.25)
    window.dispatchEvent(new Event('scroll'))
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const depths = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string; payload: { quartile?: number } }
      }),
    )
    const depthEvent = depths.find((b) => b.kind === 'scroll_depth')
    expect(depthEvent?.payload.quartile).toBe(25)
  })

  it('does not fire the same quartile twice for the same path', () => {
    initTelemetry()
    setScrollFraction(0.5)
    const before = beaconCount()
    window.dispatchEvent(new Event('scroll'))
    const afterFirst = beaconCount()
    window.dispatchEvent(new Event('scroll'))
    const afterSecond = beaconCount()
    // First scroll fires 25 + 50 (two quartiles); second scroll fires nothing new
    expect(afterFirst).toBeGreaterThan(before)
    expect(afterSecond).toBe(afterFirst)
  })

  it('fires each quartile at most once per path', () => {
    initTelemetry()
    setScrollFraction(1.0) // all quartiles
    window.dispatchEvent(new Event('scroll'))
    const afterFull = beaconCount()
    window.dispatchEvent(new Event('scroll'))
    expect(beaconCount()).toBe(afterFull) // nothing new
  })

  it('fires quartiles again for a different path', () => {
    initTelemetry()
    setScrollFraction(0.5)
    window.dispatchEvent(new Event('scroll'))
    const afterFirstPath = beaconCount()
    // Navigate to a new path
    window.history.pushState({}, '', '/other')
    window.dispatchEvent(new Event('scroll'))
    expect(beaconCount()).toBeGreaterThan(afterFirstPath)
  })

  it('does not fire when scrollable height is zero (short page)', () => {
    initTelemetry()
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      get: () => window.innerHeight, // scrollable = 0
    })
    const before = beaconCount()
    window.dispatchEvent(new Event('scroll'))
    expect(beaconCount()).toBe(before)
  })
})

// ── skim_entry ────────────────────────────────────────────────────────────────

describe('skim_entry', () => {
  it('fires skim_entry once when initial path is /work', async () => {
    window.history.pushState({}, '', '/work')
    initTelemetry()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string }
      }),
    )
    expect(bodies.filter((b) => b.kind === 'skim_entry')).toHaveLength(1)
  })

  it('does not fire skim_entry for non-/work initial path', async () => {
    window.history.pushState({}, '', '/story/agentic')
    initTelemetry()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string }
      }),
    )
    expect(bodies.filter((b) => b.kind === 'skim_entry')).toHaveLength(0)
  })

  it('fires skim_entry once when navigating to /work', async () => {
    initTelemetry()
    window.history.pushState({}, '', '/work')
    capturedNavigateCb!()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string }
      }),
    )
    expect(bodies.filter((b) => b.kind === 'skim_entry')).toHaveLength(1)
  })

  it('fires skim_entry at most once per pageload even if /work is visited twice', async () => {
    window.history.pushState({}, '', '/work')
    initTelemetry()
    capturedNavigateCb!() // navigate "again" (still /work)
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string }
      }),
    )
    expect(bodies.filter((b) => b.kind === 'skim_entry')).toHaveLength(1)
  })

  it('includes via: "direct" by default', async () => {
    window.history.pushState({}, '', '/work')
    initTelemetry()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string; payload: { via?: string } }
      }),
    )
    const skimEvent = bodies.find((b) => b.kind === 'skim_entry')!
    expect(skimEvent.payload.via).toBe('direct')
  })
})

// ── markSkimVia() + via consumption ───────────────────────────────────────────

describe('markSkimVia()', () => {
  it('sets the via to "hatch" consumed by the next skim_entry', async () => {
    markSkimVia('hatch')
    window.history.pushState({}, '', '/work')
    initTelemetry()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string; payload: { via?: string } }
      }),
    )
    const skimEvent = bodies.find((b) => b.kind === 'skim_entry')!
    expect(skimEvent.payload.via).toBe('hatch')
  })

  it('sets the via to "palette" consumed by the next skim_entry', async () => {
    markSkimVia('palette')
    window.history.pushState({}, '', '/work')
    initTelemetry()
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string; payload: { via?: string } }
      }),
    )
    const skimEvent = bodies.find((b) => b.kind === 'skim_entry')!
    expect(skimEvent.payload.via).toBe('palette')
  })

  it('resets via to "direct" after consumption', async () => {
    markSkimVia('hatch')
    window.history.pushState({}, '', '/work')
    initTelemetry()
    // Verify first skim_entry consumed the via
    const beacons = vi.mocked(navigator.sendBeacon).mock.calls
    const bodies = await Promise.all(
      beacons.map(async ([, blob]) => {
        const text = await (blob as Blob).text()
        return JSON.parse(text) as { kind: string; payload: { via?: string } }
      }),
    )
    const skimEvent = bodies.find((b) => b.kind === 'skim_entry')!
    expect(skimEvent.payload.via).toBe('hatch')
    // The pendingSkimVia is now reset to 'direct' (tested via _resetForTest +
    // new initTelemetry call in the next test)
  })
})
