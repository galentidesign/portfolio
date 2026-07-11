/**
 * Retheme motion layer — R4 "era-crossing" choreography, two consumers:
 *
 * EraRetheme (chapter routes) — mount-triggered GSAP timeline (no
 * ScrollTrigger — gsap core only), token-true (the pre-swap skin's tokens;
 * galenti ⇒ ~1.1s travel):
 *   0ms      band fades in (~100ms) and starts its viewport top→bottom travel
 *            (--motion-duration-2xl, token-drama ease); the CRT interior and
 *            HUD caption ride inside it
 *   ~12% t   caption starts typing (per-char opacity reveal — no blink, no
 *            cursor, zero reflow)
 *   e(p)=0.5 the band's centre crosses the viewport centre → onSwap fires
 *            EXACTLY once; the whole page re-tokens on that frame, hidden
 *            under the band
 *   +50ms    settle cascade begins (STAGGER_LEAD keeps the first tween off
 *            the style-recalc frame), grouped chrome → type → surface; eases
 *            are re-registered first so the settle rides the ERA's curves
 *   ~100% t  band exits below the viewport and fades out
 *
 * ScrollRethemeStory (home) — the same band, scrubbed instead of clocked:
 * createRethemeVeil writes the band's frame as a pure function of the
 * boundary's scroll progress (reversible; the engine owns the skin swap and
 * never waits on the veil), and playRethemeSettle runs the post-swap settle
 * cascade on the entered beat.
 *
 * See story/retheme/README.md for the pinned interface contract and the
 * choreography spec.
 */
import { gsap } from 'gsap'
import { registerTokenEases, tokenDuration } from '@/ds/motion/gsapPlugins'

export interface RethemeMotionHandle {
  /** Kill the timeline and leave the DOM base-styled. Must NOT call onSwap. */
  destroy(): void
}

export interface RethemeMotionOptions {
  /** Called exactly once, as the band's centre crosses the viewport centre. */
  onSwap: () => void
}

// Timing constants (seconds). Travel and settle durations come from motion
// tokens at runtime; the fallbacks only matter where custom properties don't
// resolve (jsdom) — real reduced-motion sessions never load this module.
const FADE_IN = 0.1 // band opacity 0 → 1 as it enters
const FADE_OUT = 0.12 // band opacity 1 → 0 as it exits below the fold
const TRAVEL_FALLBACK = 1.1 // --motion-duration-2xl fallback
const CAPTION_AT = 0.12 // caption type-out starts at this fraction of travel
const CHAR_INTERVAL = 0.045 // per-character reveal cadence (upper bound — long
// captions compress toward the cadence that completes the type-out before the
// band exits, so multi-line terminal captions stream rather than truncate)
const STAGGER_LEAD = 0.05 // offset from swap beat to settle start; keeps the
// first stagger tween off the style-recalc frame (§9.3 perf budget)
const SETTLE_FALLBACK = 0.24 // --motion-duration-lg fallback
const INTERVAL = 0.04 // stagger interval between settle elements

// Settle cascade order by token family. Elements declare their group via
// data-retheme-stagger="chrome|type|surface"; a bare (valueless) attribute
// ranks last, which keeps the DOM-final target the completion marker the
// e2e suite waits on.
const GROUP_RANK: Record<string, number> = { chrome: 0, type: 1, surface: 2 }
const rankOf = (el: HTMLElement): number =>
  GROUP_RANK[el.getAttribute('data-retheme-stagger') ?? ''] ?? 3

/** Parse a registered ease by name, falling back to a GSAP-core ease. */
function easeFn(name: string, fallback: string): gsap.EaseFunction {
  const parsed = gsap.parseEase(name)
  return typeof parsed === 'function' ? parsed : (gsap.parseEase(fallback) as gsap.EaseFunction)
}

/** The settle cascade itself — shared by both consumers' settles. */
function settleCascade(settleOrder: HTMLElement[]): gsap.core.Tween {
  return gsap.to(settleOrder, {
    y: 0,
    opacity: 1,
    duration: tokenDuration('lg') || SETTLE_FALLBACK,
    stagger: INTERVAL,
    ease: easeFn('token-enter', 'power1.out'),
  })
}

/**
 * Invert a monotonic ease: smallest p with ease(p) ≈ target (bisection).
 * Used to schedule onSwap at the exact moment the band's eased travel puts
 * its centre on the viewport centre — for symmetric geometry that is always
 * eased-progress 0.5, independent of band/viewport heights.
 */
function invertEase(ease: gsap.EaseFunction, target: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (ease(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function mountRethemeMotion(
  container: HTMLElement,
  { onSwap }: RethemeMotionOptions,
): RethemeMotionHandle {
  const band = container.querySelector<HTMLElement>('[data-retheme-band]')
  const captionChars = Array.from(
    container.querySelectorAll<HTMLElement>('[data-retheme-caption-char]'),
  )
  const staggerTargets = Array.from(
    container.querySelectorAll<HTMLElement>('[data-retheme-stagger]'),
  )
  return buildCrossing(band, captionChars, staggerTargets, onSwap)
}

export interface RethemeVeilHandle {
  /**
   * Write the veil's frame for scroll progress p ∈ [0, 1]. Direct style
   * writes only (band transform/opacity, per-char caption opacity) —
   * deterministic and reversible: the same p always renders the same pixels.
   */
  frame(p: number): void
  /** Clear the veil's inline styles (band returns to its CSS rest). Idempotent. */
  destroy(): void
}

// Veil shape as a function of progress. The fade windows keep the band from
// popping at the zone edges; the caption types across the mid-travel so the
// last character lands before the exit fade.
const VEIL_FADE = 0.08
const VEIL_CAPTION_START = 0.12
const VEIL_CAPTION_END = 0.85

/**
 * Scroll-boundary veil (ScrollRethemeStory): the era-crossing band as a pure
 * function of the boundary's travel progress — translated from above the
 * viewport (p=0) to below it (p=1), geometrically centred on the reference
 * line at p=0.5, the frame the engine swaps the skin under it. The veil is
 * ornament only: it never swaps skins and the engine never waits for it.
 * One layout read at creation — the engine recreates the handle on resize.
 */
export function createRethemeVeil(band: HTMLElement): RethemeVeilHandle {
  const captionChars = Array.from(band.querySelectorAll<HTMLElement>('[data-retheme-caption-char]'))
  const bandHeight = band.offsetHeight // single layout read, pre-scrub
  const viewportHeight = window.innerHeight

  // Promote the band to its own compositor layer for the scrub's lifetime —
  // GSAP did this implicitly for the old timeline; without it every frame
  // re-rasterises the full-width textured band (a measured ~100ms burst per
  // crossing at 4× throttle).
  band.style.willChange = 'transform, opacity'

  // Caption chars hide before the band can show — frame() only touches the
  // chars whose revealed state changed.
  for (const char of captionChars) char.style.opacity = '0'
  let revealed = 0
  let destroyed = false

  return {
    frame(p: number): void {
      if (destroyed) return
      const y = -bandHeight + p * (viewportHeight + bandHeight)
      band.style.transform = `translateY(${y}px)`
      band.style.opacity =
        p <= 0 || p >= 1 ? '0' : String(Math.min(p / VEIL_FADE, (1 - p) / VEIL_FADE, 1))

      const captionProgress = Math.min(
        Math.max((p - VEIL_CAPTION_START) / (VEIL_CAPTION_END - VEIL_CAPTION_START), 0),
        1,
      )
      const due = Math.floor(captionChars.length * captionProgress)
      while (revealed < due) {
        captionChars[revealed].style.opacity = '1'
        revealed++
      }
      while (revealed > due) {
        revealed--
        captionChars[revealed].style.opacity = '0'
      }
    },
    destroy(): void {
      if (destroyed) return
      destroyed = true
      band.style.removeProperty('will-change')
      band.style.removeProperty('transform')
      band.style.removeProperty('opacity')
      for (const char of captionChars) char.style.removeProperty('opacity')
    },
  }
}

export interface RethemeSettleHandle {
  /**
   * Finish, never rewind: if the cascade is mid-flight it jumps to its end
   * state before releasing its inline styles. Idempotent.
   */
  destroy(): void
}

/**
 * Post-swap settle for a scroll crossing: the entered beat's
 * [data-retheme-stagger] members dip and rise into the incoming era, grouped
 * chrome → type → surface. Starts STAGGER_LEAD after the call so the
 * pre-state write and first tween stay off the swap frame's full-page style
 * recalc. Time-based on purpose — content presence is not scrubbable; a
 * visitor who parks mid-zone still gets a settled beat.
 */
export function playRethemeSettle(settleRoot: Element): RethemeSettleHandle {
  const targets = Array.from(settleRoot.querySelectorAll<HTMLElement>('[data-retheme-stagger]'))
  if (targets.length === 0) return { destroy: (): void => {} }

  const settleOrder = [...targets].sort((a, b) => rankOf(a) - rankOf(b))
  let settle: gsap.core.Tween | null = null

  const start = (): void => {
    // The skin flipped a frame ago — register so the settle rides the
    // incoming era's own motion curves.
    registerTokenEases()
    gsap.set(settleOrder, { y: 8, opacity: 0.85 })
    settle = settleCascade(settleOrder)
  }
  const lead = gsap.delayedCall(STAGGER_LEAD, start)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      lead.kill()
      if (settle !== null) {
        // Jump to the settled state, then hand the styles back to the CSS
        // baseline (identical values) — an interrupted settle never leaves a
        // beat half-dimmed and never snaps content backward.
        settle.progress(1).kill()
        gsap.set(settleOrder, { clearProps: 'all' })
      }
    },
  }
}

function buildCrossing(
  band: HTMLElement | null,
  captionChars: HTMLElement[],
  staggerTargets: HTMLElement[],
  onSwap: () => void,
): RethemeMotionHandle {
  // Register token eases from the CURRENT (pre-swap) skin — the band travels
  // on the outgoing era's drama curve.
  registerTokenEases()

  // Stable sort: token-family group rank first, DOM order within a group.
  const settleOrder = [...staggerTargets].sort((a, b) => rankOf(a) - rankOf(b))

  const travel = tokenDuration('2xl') || TRAVEL_FALLBACK
  const travelEase = easeFn('token-drama', 'power2.inOut')
  // The band's centre crosses the viewport centre at eased progress 0.5.
  const swapAt = travel * invertEase(travelEase, 0.5)

  // Guard: GSAP fires .call() once by design, but the swapped flag is a
  // belt-and-suspenders safety net if destroy() races with the ticker.
  let swapped = false
  let settleCall: gsap.core.Tween | null = null
  let settle: gsap.core.Tween | null = null

  const startSettle = (): void => {
    // The skin flipped a frame ago — re-register so the settle rides the
    // incoming era's own motion curves (registerTokenEases overwrites by
    // name; doing it here also keeps this style read off the swap frame).
    registerTokenEases()
    if (settleOrder.length === 0) return
    settle = settleCascade(settleOrder)
  }

  const guardedSwap = (): void => {
    if (swapped) return
    swapped = true
    onSwap()
    // Settle cascade: scheduled STAGGER_LEAD after the swap so it does not
    // compete with the full-page style-recalc burst on the swap frame.
    settleCall = gsap.delayedCall(STAGGER_LEAD, startSettle)
  }

  // Establish before-states. These write the inline properties that clearProps
  // will erase on destroy(), returning each element to its CSS-class baseline.
  const bandHeight = band?.offsetHeight ?? 0 // single layout read, pre-animation
  if (band) {
    gsap.set(band, { opacity: 0, y: -bandHeight })
  }
  if (captionChars.length > 0) {
    gsap.set(captionChars, { opacity: 0 })
  }
  if (staggerTargets.length > 0) {
    gsap.set(staggerTargets, { y: 8, opacity: 0.85 })
  }

  const tl = gsap.timeline()

  if (band) {
    // Fade-in runs parallel to travel — the band materialises as it moves so
    // the cross reads as intent rather than a raw overlay.
    tl.to(band, { opacity: 1, duration: FADE_IN, ease: 'none' }, 0)

    // Travel: from fully above the viewport to fully below it. The interior
    // carries the era skin's night zone, so the crossing frame is already
    // rendered in the destination era's CRT palette while the page ahead of
    // it still wears the old skin — a designed artifact.
    tl.to(band, { y: window.innerHeight, duration: travel, ease: travelEase }, 0)

    // The band fades out over its final descent below the fold.
    tl.to(band, { opacity: 0, duration: FADE_OUT, ease: 'none' }, travel - FADE_OUT / 2)
  }

  // HUD caption types out while the band crosses — one opacity reveal per
  // character (layout pre-measured; no reflow, no blink, no oscillation).
  // Cadence adapts down for long captions so the final character lands before
  // the band starts its exit fade; DOM order makes multi-line captions stream
  // line by line.
  if (captionChars.length > 0) {
    const captionWindow = Math.max(travel * (1 - CAPTION_AT) - FADE_OUT, 0.1)
    const interval = Math.min(CHAR_INTERVAL, captionWindow / captionChars.length)
    tl.to(
      captionChars,
      { opacity: 1, duration: 0.02, stagger: interval, ease: 'none' },
      travel * CAPTION_AT,
    )
  }

  // The single data-skin flip fires while the band covers the viewport
  // centre. This triggers a full-page style recalc on the callback's frame —
  // the settle is deferred via STAGGER_LEAD (see guardedSwap).
  tl.call(guardedSwap, [], swapAt)

  let destroyed = false

  return {
    destroy(): void {
      // Idempotent: a second call after the first is a no-op.
      if (destroyed) return
      destroyed = true

      // Killing mid-flight stops the playhead immediately. GSAP will not
      // advance or fire any pending .call() callbacks after kill(), so
      // guardedSwap cannot be invoked post-destroy.
      tl.kill()
      settleCall?.kill()
      settle?.kill()

      // Return the DOM to its CSS-class baseline (band: opacity 0 via class;
      // stagger targets: whatever their base CSS defines). Safe to run even if
      // some tweens never started.
      if (band) {
        gsap.set(band, { clearProps: 'all' })
      }
      if (captionChars.length > 0) {
        gsap.set(captionChars, { clearProps: 'all' })
      }
      if (staggerTargets.length > 0) {
        gsap.set(staggerTargets, { clearProps: 'all' })
      }
    },
  }
}
