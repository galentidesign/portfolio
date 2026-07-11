/**
 * Retheme motion layer — R4 "era-crossing" choreography.
 *
 * Mount-triggered GSAP timeline (no ScrollTrigger — gsap core only).
 * See story/retheme/README.md for the pinned interface contract and the
 * choreography spec.
 *
 * Timing is token-true (the pre-swap skin's tokens; galenti ⇒ ~1.1s travel):
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
 * The interface below is the pinned contract — do not change it.
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

export interface RethemeCrossingOptions {
  /** Called exactly once, as the band's centre crosses the viewport centre. */
  onSwap: () => void
  /**
   * Root whose [data-retheme-stagger] members ride the post-swap settle.
   * ScrollRethemeStory passes the beat section entered by the crossing;
   * omit for a settle-free crossing.
   */
  settleRoot?: Element | null
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

/**
 * Scroll-boundary variant (ScrollRethemeStory): drives one boundary's own
 * band through the identical era-crossing choreography. The caption chars
 * live inside the band; settle targets come from the entered beat section.
 * Same handle contract as mountRethemeMotion — destroy() never calls onSwap.
 */
export function playRethemeCrossing(
  band: HTMLElement,
  { onSwap, settleRoot }: RethemeCrossingOptions,
): RethemeMotionHandle {
  const captionChars = Array.from(band.querySelectorAll<HTMLElement>('[data-retheme-caption-char]'))
  const staggerTargets = settleRoot
    ? Array.from(settleRoot.querySelectorAll<HTMLElement>('[data-retheme-stagger]'))
    : []
  return buildCrossing(band, captionChars, staggerTargets, onSwap)
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
    settle = gsap.to(settleOrder, {
      y: 0,
      opacity: 1,
      duration: tokenDuration('lg') || SETTLE_FALLBACK,
      stagger: INTERVAL,
      ease: easeFn('token-enter', 'power1.out'),
    })
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
