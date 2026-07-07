/**
 * Assembly motion layer — entry contract (story/assembly/README.md).
 *
 * Framework-free (pure DOM + GSAP, no React). Owns GSAP registration, the
 * single ScrollTrigger pin, the master timeline with per-beat labels, and the
 * `data-beat-active` bookkeeping. `AssemblyOpening` dynamic-imports this when
 * motion is allowed; reduced motion never downloads it.
 *
 * Enhancements layered on the scrub (all motion-chunk-only bytes):
 *   - shader field (./field, ogl) behind the hero, capability-gated
 *   - SplitText name reveal on mount (chars rise, wght 300 → 740)
 *   - Physics2D scatter chips in the shell beat (created here, never in base)
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import { registerTokenEases } from '@/ds/motion/gsapPlugins'
import { shouldMountGlLayer } from '@/ds/motion/capabilities'
import { mountField, type FieldHandle } from './field'
import { createScatterChips } from './beats/shell'
import {
  applyInitialStates,
  beatForProgress,
  buildMasterTimeline,
  createBeatContext,
  setActiveBeat,
  BEAT_IDS,
  type BeatId,
  type Timeline,
} from './timeline'

export interface AssemblyMotionOptions {
  /** Fired once when the sequence completes or is skipped. */
  onComplete?: () => void
}

export interface AssemblyMotionHandle {
  /** Jump to the end of the sequence instantly (skip is never animated). */
  skipToEnd: () => void
  /** Tear down triggers and revert inline styles (reduced-motion flip). */
  destroy: () => void
}

export function mountAssemblyMotion(
  section: HTMLElement,
  opts?: AssemblyMotionOptions,
): AssemblyMotionHandle {
  gsap.registerPlugin(ScrollTrigger, SplitText, Physics2DPlugin)
  registerTokenEases()

  let completed = false
  const complete = () => {
    if (completed) return
    completed = true
    opts?.onComplete?.()
  }

  let master: Timeline | null = null
  let trigger: ScrollTrigger | null = null
  let active: BeatId | null = null
  let field: FieldHandle | null = null
  let split: SplitText | null = null
  let reveal: gsap.core.Tween | null = null
  let removeScatter: (() => void) | null = null

  const ctx = gsap.context(() => {
    // (0) Shell-beat scatter chips exist before the initial states are set so
    //     the beat module can style their before-state like any other part.
    removeScatter = createScatterChips(section)

    const beatCtx = createBeatContext(section)

    // (1) Initial states FIRST — the flip below reveals the layered stage, and
    //     setting the before-state first prevents a flash of unstyled stage.
    applyInitialStates(beatCtx)
    // (2) Flip the CSS geometry on (steps become stacked layers).
    section.dataset.motion = 'on'
    // (3) One master timeline (labels named per beat id) + one pinning trigger.
    master = buildMasterTimeline(beatCtx)
    trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=400%',
      scrub: true,
      pin: true,
      animation: master,
      onUpdate: (self) => {
        field?.setScroll(self.progress)
        // Map the scrubbed playhead to the active beat; toggle only on change
        // so the DOM write happens ~5 times across the whole scroll, not per
        // frame (the e2e/perf capture keys on data-beat-active).
        const id = beatForProgress(self.progress)
        if (id !== active) {
          active = id
          setActiveBeat(section, id)
          field?.setBeat(BEAT_IDS.indexOf(id))
        }
      },
      // The field only draws while the pin is live — releasing past the end
      // parks its ticker work, re-entering resumes it. progress 0 means the
      // viewport is at/above the start (section still on screen — keep
      // drawing; the IntersectionObserver owns true off-screen pauses).
      onToggle: (self) => field?.setPinned(self.isActive || self.progress === 0),
      onLeave: complete,
    })

    // (4) Shader field behind the hero — capability-gated; the CSS gradient
    //     field in the base render simply remains when this never mounts.
    const fieldHost = section.querySelector<HTMLElement>('[data-assembly-field]')
    if (fieldHost && shouldMountGlLayer()) field = mountField(fieldHost)

    // (5) Name reveal — once, on load, before scroll takes over. Chars rise
    //     while the variable-font weight settles; no opacity involved, so the
    //     h1 stays painted (LCP) and AA-contrasted through every frame.
    const heading = section.querySelector<HTMLElement>('[data-assembly-hero] h1')
    if (heading) {
      split = new SplitText(heading, { type: 'chars' })
      gsap.set(split.chars, { yPercent: 44, fontVariationSettings: '"wght" 300' })
      reveal = gsap.to(split.chars, {
        yPercent: 0,
        fontVariationSettings: '"wght" 740',
        duration: 0.85,
        stagger: 0.045,
        ease: 'token-spring',
        onComplete: () => {
          // Restore the intact text node (exact kerning, no wrappers).
          split?.revert()
          split = null
        },
      })
    }

    // Exactly one step is active from frame one.
    active = 'tokens'
    setActiveBeat(section, 'tokens')
  }, section)

  return {
    skipToEnd: () => {
      // A skip is never animated: land the final state instantly so nothing is
      // mid-flight, release the pin so the caller's scroll to #gateway lands
      // cleanly, then complete once. The caller owns scroll + focus.
      reveal?.progress(1)
      master?.progress(1)
      trigger?.kill()
      field?.setScroll(1)
      complete()
    },
    destroy: () => {
      // Reduced-motion flip: reverting the context kills the trigger and
      // restores every inline style; dropping the flag returns the pixel-
      // perfect static base. Clear the active hook so nothing lingers.
      ctx.revert()
      split?.revert()
      split = null
      field?.destroy()
      field = null
      removeScatter?.()
      removeScatter = null
      delete section.dataset.motion
      section
        .querySelectorAll('[data-beat-active]')
        .forEach((el) => el.removeAttribute('data-beat-active'))
    },
  }
}
