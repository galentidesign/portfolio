/**
 * Master-timeline assembly for the assembly opening (story/assembly/README.md).
 *
 * Owns the single source of truth for the beat ranges, the shared ease
 * vocabulary, the section-scoped element lookups every beat needs, and the
 * progress -> beat mapping that drives `data-beat-active`. The per-beat modules
 * in `./beats/*` are pure choreography — they receive a `BeatContext` and add
 * their tweens to the timeline the mount builds.
 *
 * Timeline time is arbitrary: ScrollTrigger's `scrub` remaps the scroll range
 * (0..1) onto [0, DURATION], so a beat's fractional range is its share of the
 * pinned distance. Working in hundredths keeps beat positions readable.
 */
import { gsap } from 'gsap'
import * as tokens from './beats/tokens'
import * as atom from './beats/atom'
import * as molecule from './beats/molecule'
import * as organisms from './beats/organisms'
import * as shell from './beats/shell'

export type BeatId = 'tokens' | 'atom' | 'molecule' | 'organisms' | 'shell'

/** Ambient GSAP timeline type, re-exported so beats need no gsap value import. */
export type Timeline = gsap.core.Timeline

export const BEAT_IDS: readonly BeatId[] = ['tokens', 'atom', 'molecule', 'organisms', 'shell']

/**
 * Scroll ranges as fractions of the pinned distance (README timeline table).
 * Ranges are deliberately non-contiguous: the gap after each beat is its hold
 * plateau — the beat sits fully assembled with nothing animating, then the
 * exit/entrance crossfade closes the gap (see EXIT_SLOT). A beat keeps
 * `data-beat-active` through its own trailing hold (see beatForProgress).
 */
export const RANGES: Record<BeatId, { readonly start: number; readonly end: number }> = {
  tokens: { start: 0.0, end: 0.12 },
  atom: { start: 0.2, end: 0.32 },
  molecule: { start: 0.4, end: 0.53 },
  organisms: { start: 0.61, end: 0.74 },
  shell: { start: 0.82, end: 1.0 },
}

const SCALE = 100
const DURATION = SCALE
/**
 * Crossfade overlap (in timeline units): a beat's entrance leads its label by
 * this much so it dissolves into the previous beat's exit. `data-beat-active`
 * keys on the exact RANGES, so this visual lead never shifts a beat boundary.
 */
const LEAD = 4
/**
 * Exit slot (timeline units) at the end of a beat's trailing hold: the 2-unit
 * exit runs [next.start - 4, next.start - 2] and finishes exactly as the next
 * entrance borrows its LEAD/2 — the hold stays still, the handoff stays clean.
 */
const EXIT_SLOT = 4

/**
 * Ease vocabulary — the design tokens inform the curves; GSAP's power/back
 * families approximate them (warm precision, not a demo reel):
 *   enter  ~ --motion-ease-enter cubic-bezier(.22,1,.36,1) — expressive arrival
 *   exit   ~ --motion-ease-exit  cubic-bezier(.55,0,.55,.2) — accelerate away
 *   move   ~ --motion-ease-move  cubic-bezier(.45,.05,.15,1) — repositioning
 *   settle / land — soft back-out with low overshoot for "sets into place"
 *   spring / drama — the token curves themselves, registered as CustomEases
 *   by registerTokenEases() at mount (fall back to the default ease if a skin
 *   omits them — jsdom, for one, resolves no custom properties).
 */
export const EASE = {
  enter: 'power3.out',
  exit: 'power2.in',
  move: 'power2.inOut',
  settle: 'back.out(1.2)',
  land: 'back.out(1.1)',
  pop: 'back.out(1.6)',
  spring: 'token-spring',
  drama: 'token-drama',
} as const

const pos = (fraction: number): number => fraction * SCALE

export interface BeatContext {
  section: HTMLElement
  /** Crossfade lead (timeline units) an entrance may borrow before its label. */
  lead: number
  ease: typeof EASE
  /** gsap.set — routed through the context so it records inside the mount's ctx. */
  set: (target: gsap.TweenTarget, vars: gsap.TweenVars) => void
  hero: () => HTMLElement | null
  step: (id: BeatId) => HTMLElement | null
  part: (id: BeatId, name: string) => HTMLElement | null
  parts: (id: BeatId, sel: string) => HTMLElement[]
  child: (el: Element, sel: string) => HTMLElement | null
  /** Absolute timeline positions for a beat's fractional range. */
  span: (id: BeatId) => { start: number; end: number; len: number }
  /**
   * Absolute position of the beat's exit slot — at the end of its trailing
   * hold, leading the next beat's entrance. The final beat has no hold; its
   * range end comes back (shell never exits anyway).
   */
  exitAt: (id: BeatId) => number
}

export interface BeatModule {
  /** gsap.set the beat's before-state — called for every beat before the flip. */
  setInitial: (ctx: BeatContext) => void
  /** Add the beat's tweens to the master timeline within its range. */
  addToTimeline: (tl: Timeline, ctx: BeatContext) => void
}

export function createBeatContext(section: HTMLElement): BeatContext {
  return {
    section,
    lead: LEAD,
    ease: EASE,
    set: (target, vars) => {
      gsap.set(target, vars)
    },
    hero: () => section.querySelector<HTMLElement>('[data-assembly-hero]'),
    step: (id) => section.querySelector<HTMLElement>(`[data-beat="${id}"]`),
    part: (id, name) =>
      section.querySelector<HTMLElement>(`[data-beat="${id}"] [data-assembly-part="${name}"]`),
    parts: (id, sel) =>
      Array.from(section.querySelectorAll<HTMLElement>(`[data-beat="${id}"] ${sel}`)),
    child: (el, sel) => el.querySelector<HTMLElement>(sel),
    span: (id) => {
      const r = RANGES[id]
      return { start: pos(r.start), end: pos(r.end), len: pos(r.end - r.start) }
    },
    exitAt: (id) => {
      const next = BEAT_IDS[BEAT_IDS.indexOf(id) + 1]
      return next !== undefined ? pos(RANGES[next].start) - EXIT_SLOT : pos(RANGES[id].end)
    },
  }
}

const ORDER: readonly { readonly id: BeatId; readonly mod: BeatModule }[] = [
  { id: 'tokens', mod: tokens },
  { id: 'atom', mod: atom },
  { id: 'molecule', mod: molecule },
  { id: 'organisms', mod: organisms },
  { id: 'shell', mod: shell },
]

/** Apply every beat's before-state. Must run before the geometry flip. */
export function applyInitialStates(ctx: BeatContext): void {
  for (const { mod } of ORDER) mod.setInitial(ctx)
}

/**
 * Build the paused master timeline: each beat's choreography, then a label per
 * beat id at its range start, then an anchor that pins the total duration to
 * END so every range fraction maps to the same scroll fraction.
 */
export function buildMasterTimeline(ctx: BeatContext): Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.enter, force3D: true } })

  for (const { mod } of ORDER) mod.addToTimeline(tl, ctx)
  for (const { id } of ORDER) tl.addLabel(id, pos(RANGES[id].start))

  // Zero-duration no-op on the hero (opacity is already 1 — it never dims):
  // anchors the timeline's total duration to END without touching visuals.
  const hero = ctx.hero()
  if (hero) tl.set(hero, { opacity: 1 }, DURATION)

  return tl
}

/**
 * Map a ScrollTrigger progress (0..1) to the active beat. A beat stays active
 * through its trailing hold — the handoff happens only where the next beat's
 * range begins. Boundaries belong to the next beat; out-of-range clamps.
 */
export function beatForProgress(progress: number): BeatId {
  const p = Math.min(1, Math.max(0, progress))
  for (let i = 0; i < BEAT_IDS.length - 1; i++) {
    if (p < RANGES[BEAT_IDS[i + 1]].start) return BEAT_IDS[i]
  }
  return 'shell'
}

/** Keep exactly one step flagged `data-beat-active` (the e2e/perf hook). */
export function setActiveBeat(section: HTMLElement, id: BeatId): void {
  const steps = section.querySelectorAll<HTMLElement>('[data-beat]')
  steps.forEach((el) => {
    if (el.getAttribute('data-beat') === id) el.setAttribute('data-beat-active', '')
    else el.removeAttribute('data-beat-active')
  })
}
