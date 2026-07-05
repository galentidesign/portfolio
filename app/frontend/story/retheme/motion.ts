/**
 * Retheme motion layer — wave 1A implementation.
 *
 * Mount-triggered GSAP timeline (no ScrollTrigger — gsap core only).
 * See story/retheme/README.md for the pinned choreography spec.
 *
 * ~700ms total, era-snappy:
 *   0ms      sweep fades in (80ms) + begins travel (420ms, power1.inOut)
 *   ~140ms   onSwap fires (at 1/3 of travel); page re-tokens on this frame
 *   ~190ms   stagger settle begins (50ms offset from swap for perf)
 *   420ms    sweep fade-out starts (120ms)
 *   540ms    sweep fully faded out
 *
 * The interface below is the pinned contract — do not change it.
 */
import { gsap } from 'gsap'

export interface RethemeMotionHandle {
  /** Kill the timeline and leave the DOM base-styled. Must NOT call onSwap. */
  destroy(): void
}

export interface RethemeMotionOptions {
  /** Called exactly once, at the sweep-cross beat. */
  onSwap: () => void
}

// Timing constants (seconds) matching the README choreography.
const FADE_IN = 0.08 // sweep opacity 0 → 1
const TRAVEL = 0.42 // sweep translateY 0 → innerHeight, power1.inOut
const SWAP_AT = TRAVEL / 3 // ~0.14s — call onSwap at 1/3 of travel
const STAGGER_LEAD = 0.05 // offset from swap beat to settle start; keeps the
// first stagger tween off the style-recalc frame (§9.3 perf budget)
const SETTLE = 0.24 // per-element settle duration
const INTERVAL = 0.04 // stagger interval between elements
const FADE_OUT = 0.12 // sweep opacity 1 → 0 at the end of travel

export function mountRethemeMotion(
  container: HTMLElement,
  { onSwap }: RethemeMotionOptions,
): RethemeMotionHandle {
  const sweep = container.querySelector<HTMLElement>('[data-retheme-sweep]')
  const staggerTargets = Array.from(
    container.querySelectorAll<HTMLElement>('[data-retheme-stagger]'),
  )

  // Guard: GSAP fires .call() once by design, but the swapped flag is a
  // belt-and-suspenders safety net if destroy() races with the ticker.
  let swapped = false
  const guardedSwap = (): void => {
    if (swapped) return
    swapped = true
    onSwap()
  }

  // Establish before-states. These write the inline properties that clearProps
  // will erase on destroy(), returning each element to its CSS-class baseline.
  if (sweep) {
    gsap.set(sweep, { opacity: 0, y: 0 })
  }
  if (staggerTargets.length > 0) {
    gsap.set(staggerTargets, { y: 8, opacity: 0.85 })
  }

  const tl = gsap.timeline()

  if (sweep) {
    // Fade-in runs parallel to travel — the bar materialises as it moves so
    // the cross reads as intent rather than a raw overlay.
    tl.to(sweep, { opacity: 1, duration: FADE_IN, ease: 'none' }, 0)

    // Travel: viewport top → bottom. The element carries --color-accent so it
    // re-tokens mid-travel (sienna → Bootstrap blue) — a designed artifact.
    tl.to(sweep, { y: window.innerHeight, duration: TRAVEL, ease: 'power1.inOut' }, 0)
  }

  // At 1/3 of travel: the data-skin flip fires. This triggers a full-page
  // style recalc on the callback's frame — scheduled here to maximise stable
  // frame budget on both sides of the event.
  tl.call(guardedSwap, [], SWAP_AT)

  // Settle stagger: the first tween starts STAGGER_LEAD seconds after the
  // swap so it does not compete with the style-recalc burst on the swap frame.
  if (staggerTargets.length > 0) {
    tl.to(
      staggerTargets,
      {
        y: 0,
        opacity: 1,
        duration: SETTLE,
        stagger: INTERVAL,
        ease: 'power1.out',
      },
      SWAP_AT + STAGGER_LEAD,
    )
  }

  // Sweep fades out as it finishes its travel (it stays fully opaque while
  // the content settles so the accent-bar is visible mid-travel).
  if (sweep) {
    tl.to(sweep, { opacity: 0, duration: FADE_OUT }, TRAVEL)
  }

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

      // Return the DOM to its CSS-class baseline (sweep: opacity 0 via class;
      // stagger targets: whatever their base CSS defines). Safe to run even if
      // some tweens never started.
      if (sweep) {
        gsap.set(sweep, { clearProps: 'all' })
      }
      if (staggerTargets.length > 0) {
        gsap.set(staggerTargets, { clearProps: 'all' })
      }
    },
  }
}
