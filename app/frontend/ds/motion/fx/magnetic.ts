// Magnetic lean — buttons/pills/CTAs tilt toward a nearby cursor.
//
// A window pointermove listener (cheap distance cull, no layout thrash beyond
// one getBoundingClientRect per move) leans the element up to ±6px via
// gsap.quickTo; the same spring-eased tweens carry it back to rest when the
// pointer leaves the radius. Coarse/touch pointers get a no-op handle —
// there is no cursor to lean toward.
import { gsap, hasFinePointer, noopHandle, tokenDuration } from './runtime'
import type { FxHandle } from './types'

export interface MagneticOptions {
  /** Lean intensity 0–1; scales the ±6px maximum translate. */
  strength?: number
}

const MAX_LEAN = 6 // px — the hard cap, in any direction
const RADIUS = 96 // px beyond the element's edge where the pull begins

export function mountMagnetic(el: HTMLElement, { strength = 1 }: MagneticOptions = {}): FxHandle {
  if (!hasFinePointer()) return noopHandle

  const duration = tokenDuration('lg') || 0.4
  const xTo = gsap.quickTo(el, 'x', { duration, ease: 'token-spring' })
  const yTo = gsap.quickTo(el, 'y', { duration, ease: 'token-spring' })

  // Tracks whether the element is currently leaning, so leaving the radius
  // fires the spring return exactly once instead of on every far move.
  let engaged = false

  const onPointerMove = (e: PointerEvent): void => {
    const rect = el.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    // Distance from the element's edge, not its center — wide pills engage
    // as readily as square icons.
    const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2)
    const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2)
    const dist = Math.hypot(edgeX, edgeY)

    if (dist > RADIUS) {
      if (engaged) {
        engaged = false
        xTo(0)
        yTo(0)
      }
      return
    }

    engaged = true
    const fall = 1 - dist / RADIUS // 1 over the element → 0 at the radius edge
    const nx = dx / (rect.width / 2 + RADIUS) // −1…1 across the active field
    const ny = dy / (rect.height / 2 + RADIUS)
    xTo(nx * fall * MAX_LEAN * strength)
    yTo(ny * fall * MAX_LEAN * strength)
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      window.removeEventListener('pointermove', onPointerMove)
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'transform' })
    },
  }
}
