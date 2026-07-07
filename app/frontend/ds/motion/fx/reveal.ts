// Scroll-enter reveal — children rise 12–16px and fade in, staggered, once.
//
// The base render is fully visible: this mount SETS the hidden state (never
// CSS — a CSS-hidden default would blank the page for non-fx visitors) and
// only for elements still outside the viewport at mount time, so
// above-the-fold content never flickers on load. Each element reveals once,
// on scroll-enter, then hands its styles back to the cascade (clearProps).
import { gsap, tokenDuration } from './runtime'
import type { FxHandle } from './types'

export interface RevealOptions {
  /** Target selector inside the container; defaults to its element children. */
  selector?: string
  /** Seconds between successive targets in one reveal batch. */
  stagger?: number
}

const RISE = 14 // px

export function mountReveal(
  container: HTMLElement,
  { selector, stagger = 0.06 }: RevealOptions = {},
): FxHandle {
  const targets = selector
    ? Array.from(container.querySelectorAll<HTMLElement>(selector))
    : Array.from(container.children).filter((c): c is HTMLElement => c instanceof HTMLElement)

  // Only elements that have yet to enter the viewport animate — anything
  // already on screen at mount stays put, so the initial paint is stable.
  const pending = targets.filter((el) => {
    const rect = el.getBoundingClientRect()
    return rect.top >= window.innerHeight || rect.bottom <= 0
  })

  if (pending.length === 0) return { destroy: () => {} }

  gsap.set(pending, { y: RISE, opacity: 0 })

  const remaining = new Set(pending)
  const io = new IntersectionObserver(
    (entries) => {
      const batch = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .filter((el) => remaining.has(el))
        .sort((a, b) => targets.indexOf(a) - targets.indexOf(b))
      if (batch.length === 0) return
      for (const el of batch) {
        remaining.delete(el)
        io.unobserve(el)
      }
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: tokenDuration('lg') || 0.4,
        ease: 'token-enter',
        stagger,
        // Hand styles back to the cascade once settled so base CSS (e.g.
        // Card's hover translate) works untouched after the reveal.
        clearProps: 'transform,opacity',
      })
    },
    // Wake slightly inside the viewport so the rise is actually seen.
    { rootMargin: '0px 0px -10% 0px' },
  )
  for (const el of pending) io.observe(el)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      io.disconnect()
      gsap.killTweensOf(pending)
      gsap.set(pending, { clearProps: 'transform,opacity' })
    },
  }
}
