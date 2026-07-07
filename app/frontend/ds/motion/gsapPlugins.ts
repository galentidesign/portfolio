// GSAP plugin conventions for motion modules.
//
// Import this file ONLY from dynamically-imported motion modules (files under
// a <feature>/motion/ directory, so their chunks are named motion-* and stay
// covered by the reduced-motion network guard). Never import from base bundles.
//
// Plugin registration stays per-feature: each motion module imports exactly
// the plugins it uses from 'gsap/<Plugin>' and calls gsap.registerPlugin
// itself — a single bulk registry would drag every plugin into every motion
// chunk and blow the per-route budgets.
import { gsap } from 'gsap'

const TOKEN_EASES = ['enter', 'exit', 'move', 'drama', 'spring'] as const
export type TokenEaseName = (typeof TOKEN_EASES)[number]

/**
 * Register the semantic motion-token eases as named GSAP eases
 * ('token-enter', 'token-drama', …), read live from the active skin's
 * --motion-ease-* custom properties so timelines stay token-true.
 *
 * The tokens only ever emit `linear` or `cubic-bezier(…)`, so a small
 * unit-bezier solver covers them exactly — the CustomEase plugin would cost
 * every motion chunk ~3kB gz to parse the same four numbers.
 *
 * gsap.registerEase overwrites by name — safe to call again after a skin
 * flip (the retheme motion module does) to re-sync eases to the new skin.
 */
export function registerTokenEases(): void {
  const styles = getComputedStyle(document.documentElement)
  for (const name of TOKEN_EASES) {
    const value = styles.getPropertyValue(`--motion-ease-${name}`).trim()
    if (!value) continue
    if (value === 'linear') {
      gsap.registerEase(`token-${name}`, (p) => p)
      continue
    }
    const nums = value
      .match(/^cubic-bezier\(([^)]+)\)$/)?.[1]
      .split(',')
      .map(Number)
    if (nums?.length === 4 && nums.every(Number.isFinite)) {
      gsap.registerEase(`token-${name}`, cubicBezier(nums[0], nums[1], nums[2], nums[3]))
    }
  }
}

/**
 * cubic-bezier(x1, y1, x2, y2) — the CSS timing function: solve the curve's
 * parameter for a given progress x (Newton–Raphson, bisection fallback — CSS
 * guarantees x1/x2 ∈ [0,1] so x(t) is monotonic), then evaluate y. y may
 * legitimately leave [0,1] mid-curve (the spring token overshoots).
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
  const ax = 3 * x1 - 3 * x2 + 1
  const bx = 3 * x2 - 6 * x1
  const ay = 3 * y1 - 3 * y2 + 1
  const by = 3 * y2 - 6 * y1
  const sampleX = (t: number) => ((ax * t + bx) * t + 3 * x1) * t
  const sampleY = (t: number) => ((ay * t + by) * t + 3 * y1) * t
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + 3 * x1

  const solveT = (x: number): number => {
    let t = x
    for (let i = 0; i < 6; i++) {
      const dx = sampleDX(t)
      if (Math.abs(dx) < 1e-6) break
      t -= (sampleX(t) - x) / dx
    }
    if (t >= 0 && t <= 1 && Math.abs(sampleX(t) - x) < 1e-4) return t
    let lo = 0
    let hi = 1
    while (hi - lo > 1e-5) {
      t = (lo + hi) / 2
      if (sampleX(t) < x) lo = t
      else hi = t
    }
    return t
  }

  return (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : sampleY(solveT(p)))
}

/**
 * Read a --motion-duration-* token as seconds for GSAP timelines.
 * Handles both CSS time units: tokens are authored in ms, but the production
 * CSS minifier rewrites e.g. `1100ms` → `1.1s`, so the unit must be parsed,
 * never assumed. Returns 0 under reduced motion (motion-overrides.css zeroes
 * the vars), which collapses tweens to instant sets — but motion modules
 * should not be loaded at all in that mode; this is belt-and-suspenders.
 */
export function tokenDuration(name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--motion-duration-${name}`)
    .trim()
  const amount = parseFloat(value)
  if (!Number.isFinite(amount)) return 0
  return value.endsWith('ms') ? amount / 1000 : amount
}
