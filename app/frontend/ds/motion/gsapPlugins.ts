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
import { CustomEase } from 'gsap/CustomEase'

const TOKEN_EASES = ['enter', 'exit', 'move', 'drama', 'spring'] as const
export type TokenEaseName = (typeof TOKEN_EASES)[number]

/**
 * Register the semantic motion-token eases as named GSAP eases
 * ('token-enter', 'token-drama', …), read live from the active skin's
 * --motion-ease-* custom properties so timelines stay token-true.
 *
 * CustomEase.create overwrites by id — safe to call again after a skin flip
 * (the retheme motion module does) to re-sync eases to the new skin.
 */
export function registerTokenEases(): void {
  gsap.registerPlugin(CustomEase)
  const styles = getComputedStyle(document.documentElement)
  for (const name of TOKEN_EASES) {
    const value = styles.getPropertyValue(`--motion-ease-${name}`).trim()
    if (!value) continue
    if (value === 'linear') {
      CustomEase.create(`token-${name}`, '0, 0, 1, 1')
    } else {
      const bezier = value.match(/^cubic-bezier\(([^)]+)\)$/)?.[1]
      if (bezier) CustomEase.create(`token-${name}`, bezier)
    }
  }
}

/**
 * Read a --motion-duration-* token as seconds for GSAP timelines.
 * Returns 0 under reduced motion (motion-overrides.css zeroes the vars),
 * which collapses tweens to instant sets — but motion modules should not
 * be loaded at all in that mode; this is belt-and-suspenders.
 */
export function tokenDuration(name: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): number {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--motion-duration-${name}`)
    .trim()
  const ms = parseFloat(value)
  return Number.isFinite(ms) ? ms / 1000 : 0
}
