// Wordmark glyph play — one-two glyphs misbehaving via the variable weight
// axis (design-direction §6: boldness spent exactly there). Operates on the
// consumer's [data-glyph] spans, picks its victims deterministically, locks
// each victim's box width so the breathing weight never reflows the line,
// and eases font-variation-settings on the gsap ticker. Pauses offscreen and
// in hidden tabs. Static base = the wordmark at rest; destroy() restores it.
import { gsap } from './runtime'
import type { FxHandle } from './types'
import { noopHandle } from './runtime'

export interface GlyphPlayOptions {
  /** Weight swing around the resting weight (default 240, clamped 100–900). */
  amplitude?: number
  /** Seconds per full breath (default 3.4 — slow, drama not flicker). */
  period?: number
}

const AMPLITUDE = 240
const PERIOD = 3.4
const AXIS_MIN = 100
const AXIS_MAX = 900

export function mountGlyphPlay(el: HTMLElement, options: GlyphPlayOptions = {}): FxHandle {
  const glyphs = Array.from(el.querySelectorAll<HTMLElement>('[data-glyph]'))
  if (glyphs.length === 0) return noopHandle

  // Deterministic victims — two glyphs off the golden-ish thirds, deduped
  // (a short wordmark may collapse to one).
  const picks = [...new Set([Math.floor(glyphs.length * 0.42), Math.floor(glyphs.length * 0.72)])]
    .map((i) => glyphs[i])
    .filter((g): g is HTMLElement => g !== undefined)

  const base = Number.parseFloat(getComputedStyle(el).fontWeight) || 720
  const amplitude = options.amplitude ?? AMPLITUDE
  const period = options.period ?? PERIOD

  // Lock each victim's box so weight breathing never shuffles its neighbours
  // (skipped where layout isn't live — jsdom, display:none).
  const locked: HTMLElement[] = []
  for (const glyph of picks) {
    const width = glyph.getBoundingClientRect().width
    if (width > 0) {
      glyph.style.display = 'inline-block'
      glyph.style.width = `${width}px`
      locked.push(glyph)
    }
  }

  let elapsed = 0
  const tick = (_time: number, deltaTime: number): void => {
    elapsed += deltaTime / 1000
    const omega = (Math.PI * 2) / period
    picks.forEach((glyph, k) => {
      const weight = Math.min(
        Math.max(base + amplitude * Math.sin(elapsed * omega + k * Math.PI * 0.6), AXIS_MIN),
        AXIS_MAX,
      )
      glyph.style.setProperty('font-variation-settings', `'wght' ${Math.round(weight)}`)
    })
  }

  let running = false
  let intersecting = false
  const sync = (): void => {
    const shouldRun = intersecting && document.visibilityState === 'visible'
    if (shouldRun && !running) {
      running = true
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
  io.observe(el)

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
      for (const glyph of picks) {
        glyph.style.removeProperty('font-variation-settings')
      }
      for (const glyph of locked) {
        glyph.style.removeProperty('display')
        glyph.style.removeProperty('width')
      }
    },
  }
}
