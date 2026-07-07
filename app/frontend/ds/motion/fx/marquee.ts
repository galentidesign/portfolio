// Velocity-reactive marquee — an infinite strip whose drift speed eases with
// the visitor's scroll velocity (fast scroll → faster drift, lerped back to
// rest). The single source row is the accessible content; this mount appends
// aria-hidden clones until the loop covers 2× the viewport, drives the track
// with a gsap.ticker + quickSetter, and pauses entirely while offscreen
// (IntersectionObserver) or in a hidden tab (visibilitychange).
import { gsap } from './runtime'
import type { FxHandle } from './types'

const BASE_SPEED = 40 // px/s drift at rest
const MAX_BOOST = 5 // top speed multiplier under fast scroll
const VELOCITY_FULL = 3000 // px/s of scroll that earns the full boost
const RECOVER = 0.06 // per-tick lerp back toward the current target speed

export function mountMarquee(track: HTMLElement): FxHandle {
  const originals = Array.from(track.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement,
  )
  const width = track.scrollWidth

  // Enough copies that the loop never shows a gap — one extra set covers a
  // centered track's overhang through a full wrap period. Degenerate
  // zero-width measurements (display:none, test DOMs) still get one clone
  // set so the duplication contract holds.
  const copies = width > 0 ? Math.ceil((2 * window.innerWidth) / width) + 1 : 1
  const clones: HTMLElement[] = []
  for (let i = 0; i < copies; i++) {
    for (const node of originals) {
      const clone = node.cloneNode(true) as HTMLElement
      clone.setAttribute('aria-hidden', 'true')
      track.appendChild(clone)
      clones.push(clone)
    }
  }

  // Loop period = distance between an original and its first clone (captures
  // flex gap exactly); falls back to content width when layout isn't live.
  const period =
    originals.length > 0 && clones.length > 0
      ? clones[0].offsetLeft - originals[0].offsetLeft || width
      : width

  const setX = gsap.quickSetter(track, 'x', 'px') as (value: number) => void

  let pos = 0
  let factor = 1
  let lastScrollY = window.scrollY

  const tick = (_time: number, deltaTime: number): void => {
    const dt = deltaTime / 1000
    if (dt <= 0) return
    const scrollY = window.scrollY
    const velocity = Math.abs(scrollY - lastScrollY) / dt
    lastScrollY = scrollY
    const target = 1 + Math.min(velocity / VELOCITY_FULL, 1) * (MAX_BOOST - 1)
    factor += (target - factor) * RECOVER
    if (period > 0) {
      pos = (pos - BASE_SPEED * factor * dt) % period
      setX(pos)
    }
  }

  let running = false
  let intersecting = false
  const sync = (): void => {
    const shouldRun = intersecting && document.visibilityState === 'visible'
    if (shouldRun && !running) {
      running = true
      lastScrollY = window.scrollY
      gsap.ticker.add(tick)
    } else if (!shouldRun && running) {
      running = false
      gsap.ticker.remove(tick)
    }
  }

  const onVisibility = (): void => sync()
  document.addEventListener('visibilitychange', onVisibility)

  const io = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting
    sync()
  })
  io.observe(track)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (running) {
        running = false
        gsap.ticker.remove(tick)
      }
      for (const clone of clones) clone.remove()
      gsap.set(track, { clearProps: 'transform' })
    },
  }
}
