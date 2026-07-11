import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MotionPrefProvider } from '@/ds/motion/useMotionPref'
import { SkinProvider } from '@/shell/skin/SkinProvider'
import { SKIN_STORAGE_KEY, skins } from '@/ds/tokens/generated/skins'
import { ScrollRetheme } from './ScrollRetheme'
import { ScrollRethemeStory } from './ScrollRethemeStory'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const labelOf = (name: string) => skins.find((s) => s.name === name)?.label ?? name

/**
 * Three-rung ladder: base → rails-era → agentic → sweep home. Markers are
 * positioned by mocking their rects; jsdom's viewport is 768px tall, so the
 * coordinator's reference line sits at 384.
 */
function renderStory() {
  return render(
    <MotionPrefProvider>
      <SkinProvider>
        <ScrollRethemeStory>
          <section>beat A</section>
          <ScrollRetheme skin="rails-era" treatment="crt" announce="Re-theming to 2014" />
          <section>beat B</section>
          <ScrollRetheme skin="agentic" treatment="terminal" caption="$ kiln up" />
          <section>beat C</section>
          <ScrollRetheme />
          <section>beat D</section>
        </ScrollRethemeStory>
      </SkinProvider>
    </MotionPrefProvider>,
  )
}

const skinAttr = () => document.documentElement.dataset.skin

function setTops(tops: readonly number[]) {
  screen.getAllByTestId('scroll-retheme').forEach((el, i) => {
    el.getBoundingClientRect = () =>
      ({
        top: tops[i],
        bottom: tops[i],
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: tops[i],
        toJSON: () => ({}),
      }) as DOMRect
  })
}

/** Position the markers, fire a scroll, and flush the rAF-throttled handler. */
async function scrollTo(tops: readonly number[]) {
  setTops(tops)
  await act(async () => {
    window.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
  })
}

// Marker layouts: all below the fold (base), then each rung crossed in turn.
const AT_BASE = [600, 1400, 2200] as const
const AT_RAILS = [200, 1000, 1800] as const
const AT_AGENTIC = [-600, 200, 1000] as const
const AT_SWEEP = [-1400, -600, 200] as const

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  delete document.documentElement.dataset.skin
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

afterEach(() => {
  delete document.documentElement.dataset.skin
  delete document.documentElement.dataset.motion
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// Reduced motion — the instant path drives every ladder rule deterministically
// ---------------------------------------------------------------------------

describe('ScrollRethemeStory under reduced motion', () => {
  beforeEach(() => {
    document.documentElement.dataset.motion = 'reduced'
    document.documentElement.dataset.skin = 'galenti'
  })

  it('applies the era skin when its boundary crosses the viewport centre', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    expect(skinAttr()).toBe('galenti')
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
  })

  it('walks the full ladder down and sweeps home to the base skin', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    await scrollTo(AT_AGENTIC)
    expect(skinAttr()).toBe('agentic')
    await scrollTo(AT_SWEEP)
    expect(skinAttr()).toBe('galenti')
  })

  it('re-applies the previous skin scrolling back up (bidirectional)', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_AGENTIC)
    expect(skinAttr()).toBe('agentic')
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    await scrollTo(AT_BASE)
    expect(skinAttr()).toBe('galenti')
  })

  it("sweeps home to a non-default entry skin (the visitor's own ground)", async () => {
    document.documentElement.dataset.skin = 'debug'
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_AGENTIC)
    expect(skinAttr()).toBe('agentic')
    await scrollTo(AT_SWEEP)
    expect(skinAttr()).toBe('debug')
  })

  it('never writes localStorage (story re-themes are not a preference)', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    await scrollTo(AT_AGENTIC)
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBeNull()
  })

  it('restores the entry skin on unmount mid-era', async () => {
    const { unmount } = renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    unmount()
    expect(skinAttr()).toBe('galenti')
  })

  it('lets an explicit mid-story switch-away win — no fight, nothing restored', async () => {
    const { unmount } = renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    // Simulate an explicit palette switch (persisting path: attr + storage).
    document.documentElement.dataset.skin = 'debug'
    localStorage.setItem(SKIN_STORAGE_KEY, 'debug')
    // Further scrolling inside the SAME segment must not re-apply the era.
    await scrollTo([180, 980, 1780])
    expect(skinAttr()).toBe('debug')
    unmount()
    expect(skinAttr()).toBe('debug')
  })

  it('keeps re-theming at later boundaries after a mid-story re-pick, then sweeps to it', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    document.documentElement.dataset.skin = 'debug'
    localStorage.setItem(SKIN_STORAGE_KEY, 'debug')
    // The next boundary is a fresh story moment — it still rethemes…
    await scrollTo(AT_AGENTIC)
    expect(skinAttr()).toBe('agentic')
    // …and the sweep-home boundary now grounds on the adopted pick.
    await scrollTo(AT_SWEEP)
    expect(skinAttr()).toBe('debug')
  })

  it('honours an explicit mid-story persisted re-pick of the era skin itself', async () => {
    const { unmount } = renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    // Attr already matches the story skin; only storage changes.
    localStorage.setItem(SKIN_STORAGE_KEY, 'rails-era')
    unmount()
    expect(skinAttr()).toBe('rails-era')
  })

  it('ignores a stale stored preference from before the story (?skin= entry)', async () => {
    localStorage.setItem(SKIN_STORAGE_KEY, 'debug')
    document.documentElement.dataset.skin = 'galenti'
    const { unmount } = renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    unmount()
    expect(skinAttr()).toBe('galenti')
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBe('debug')
  })

  it('announces crossings politely — custom going down, skin label coming back', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(screen.getByRole('status')).toHaveTextContent('Re-theming to 2014')
    await scrollTo(AT_BASE)
    expect(screen.getByRole('status')).toHaveTextContent(`Theme: ${labelOf('galenti')}`)
  })

  it('holds the segment while a post-swap layout shift wobbles the marker (thrash guard)', async () => {
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    // A re-token shifts era type metrics and can push the just-crossed marker
    // back below the reference line (384). Inside the crossing guard (landed
    // at 200 in jsdom → retreat line max(200, 384) + 48) the ladder holds…
    await scrollTo([420, 1220, 2020])
    expect(skinAttr()).toBe('rails-era')
    // …and only a real scroll past the retreat line restores the base.
    await scrollTo([580, 1380, 2180])
    expect(skinAttr()).toBe('galenti')
  })

  it('no-ops silently when the target skin is already live (deep-link entry)', async () => {
    document.documentElement.dataset.skin = 'rails-era'
    renderStory()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})

// ---------------------------------------------------------------------------
// Motion allowed — band markup + the crossing choreography path
// ---------------------------------------------------------------------------

describe('ScrollRetheme with motion allowed', () => {
  beforeEach(() => {
    document.documentElement.dataset.skin = 'galenti'
  })

  it('renders each boundary as an inert band with treatment and night-zone interior', async () => {
    renderStory()
    const markers = screen.getAllByTestId('scroll-retheme')
    // The band dressing arrives at the idle slot (LCP guardrail).
    await waitFor(() => expect(markers[0].querySelector('[data-retheme-band]')).not.toBeNull())
    const band = markers[0].querySelector('[data-retheme-band]')
    expect(band).toHaveAttribute('aria-hidden', 'true')
    expect(band).toHaveAttribute('data-retheme-treatment', 'crt')
    const interior = markers[0].querySelector('[data-retheme-band] [data-zone="night"]')
    expect(interior).toHaveAttribute('data-skin', 'rails-era')
  })

  it("binds the sweep-home band to the story's base skin, with no era treatment", async () => {
    renderStory()
    const sweep = screen.getAllByTestId('scroll-retheme')[2]
    expect(sweep).toHaveAttribute('data-era-skin', 'galenti')
    await waitFor(() => expect(sweep.querySelector('[data-retheme-band]')).not.toBeNull())
    const band = sweep.querySelector('[data-retheme-band]')
    expect(band).not.toHaveAttribute('data-retheme-treatment')
    const interior = sweep.querySelector('[data-retheme-band] [data-zone="night"]')
    expect(interior).toHaveAttribute('data-skin', 'galenti')
  })

  it('renders the HUD caption as per-character spans for the type-out', async () => {
    renderStory()
    const agenticMarker = screen.getAllByTestId('scroll-retheme')[1]
    await waitFor(() => {
      const text = Array.from(agenticMarker.querySelectorAll('[data-retheme-caption-char]'))
        .map((el) => el.textContent)
        .join('')
      expect(text).toBe('$ kiln up')
    })
  })

  /** Wait for the idle band dress AND the motion chunk to be resident. */
  async function dressAndSettle() {
    await waitFor(() => expect(document.querySelector('[data-retheme-band]')).not.toBeNull())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
  }

  const railsBand = () =>
    screen.getAllByTestId('scroll-retheme')[0].querySelector<HTMLElement>('[data-retheme-band]')

  const translateY = (el: HTMLElement | null) =>
    Number.parseFloat(/translateY\(([-\d.]+)px\)/.exec(el?.style.transform ?? '')?.[1] ?? 'NaN')

  const revealedCaptionChars = (marker: Element) =>
    Array.from(marker.querySelectorAll<HTMLElement>('[data-retheme-caption-char]')).filter(
      (c) => c.style.opacity === '1',
    ).length

  it('applies the skin on the geometric crossing frame even with the motion chunk resident', async () => {
    renderStory()
    await dressAndSettle()
    await scrollTo(AT_BASE)
    expect(skinAttr()).toBe('galenti')
    // The swap is synchronous with the geometry — the veil is ornament and
    // never gates it (the deferred-swap model this replaces flaked whenever a
    // crossing was cut before its timeline's swap beat).
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    expect(localStorage.getItem(SKIN_STORAGE_KEY)).toBeNull()
  })

  it('upward reversal restores the previous skin on the crossing frame, veil riding back', async () => {
    renderStory()
    await dressAndSettle()
    await scrollTo(AT_BASE)
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    await scrollTo(AT_BASE)
    expect(skinAttr()).toBe('galenti')
    // The rails boundary sits at 600 — inside the zone from below, so the
    // reversed veil dresses it below the reference line (p < 0.5).
    expect(translateY(railsBand())).toBeCloseTo(768 * (1 - 600 / 768), 3)
  })

  it('never loses or delays a swap under a multi-segment jump', async () => {
    renderStory()
    await dressAndSettle()
    await scrollTo(AT_BASE)
    // One flick across two boundaries: the newest target applies this frame.
    await scrollTo(AT_AGENTIC)
    expect(skinAttr()).toBe('agentic')
    await scrollTo(AT_SWEEP)
    expect(skinAttr()).toBe('galenti')
  })

  it('covers the viewport centre with the veil on the swap frame', async () => {
    renderStory()
    await dressAndSettle()
    await scrollTo(AT_BASE)
    // Marker top exactly on the reference line (384 of 768): the crossing
    // frame. p = 0.5 puts the band's centre on the same line the swap fires.
    await scrollTo([384, 1200, 2000])
    expect(skinAttr()).toBe('rails-era')
    const band = railsBand()
    expect(translateY(band)).toBeCloseTo(384, 3)
    expect(band?.style.opacity).toBe('1')
  })

  it('renders the veil as a pure function of scroll — reversing recedes band and caption', async () => {
    renderStory()
    await dressAndSettle()
    await scrollTo(AT_BASE)
    // Deep into the zone (p ≈ 0.7): band well past centre, caption mostly out.
    await scrollTo([231, 1050, 1850])
    const marker = screen.getAllByTestId('scroll-retheme')[0]
    const deepY = translateY(railsBand())
    const deepChars = revealedCaptionChars(marker)
    expect(deepChars).toBeGreaterThan(0)
    // Back up the same zone (p ≈ 0.3): the same geometry renders further up,
    // with fewer characters — the veil rewinds with the scroll.
    await scrollTo([538, 1350, 2150])
    expect(translateY(railsBand())).toBeLessThan(deepY)
    expect(revealedCaptionChars(marker)).toBeLessThan(deepChars)
  })

  it('lets a band mounting mid-zone pick up at the current progress', async () => {
    renderStory()
    // Cross rails immediately — before the idle dress and the motion chunk:
    // the swap must not wait for either.
    await scrollTo(AT_RAILS)
    expect(skinAttr()).toBe('rails-era')
    // Once the dressing and chunk arrive, the next processed frame picks the
    // band up at the boundary's current progress — mid-zone, correct place.
    await dressAndSettle()
    await scrollTo([200, 1000, 1800])
    expect(translateY(railsBand())).toBeCloseTo(768 * (1 - 200 / 768), 3)
  })
})
