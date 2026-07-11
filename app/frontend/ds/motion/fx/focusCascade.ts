// Focus cascade — a key statement sharpens from haze into ink, word by word
// (the lens pulls focus; kin to the typewriter but continuous, not typed).
// The static base render carries the full text (fallback-as-base: reduced
// motion and SEO read the finished statement); this mount replaces it with a
// visually-hidden accessible copy plus aria-hidden per-word spans, softens
// them (blur, pale, nudged down), and lets one staggered tween resolve them
// to rest. The rise rides `top` on position:relative spans, NOT a gsap
// transform: transforms on unrendered elements take GSAP's reparent-and-
// measure fallback, which re-inserts each span before its nextElementSibling
// — silently hoisting the inter-word text nodes out of order. Relative `top`
// offsets paint without moving any other box, so the reveal stays zero-reflow.
// destroy() restores the original DOM.
import { gsap, tokenDuration } from './runtime'
import type { FxHandle } from './types'
import { noopHandle } from './runtime'

export interface FocusCascadeOptions {
  /** Seconds between word starts, upper bound — long text compresses (default 0.09). */
  stagger?: number
  /** Ceiling for the whole cascade, seconds (default 2.4). */
  maxDuration?: number
  /** Seconds to hold before the first word (default 0.15). */
  delay?: number
  onComplete?: () => void
}

const STAGGER = 0.09
const MAX_DURATION = 2.4
const DELAY = 0.15
// The soft state is a VISIBLE transient (unlike the typewriter's opacity-0
// chars, axe scans it): 0.55 ink over bone keeps display-scale text ~4:1,
// above the 3:1 large-text floor, while the blur carries the haze.
const SOFT_OPACITY = 0.55
const SOFT_RISE = 6 // px
const SOFT_BLUR = 8 // px

export function mountFocusCascade(el: HTMLElement, options: FocusCascadeOptions = {}): FxHandle {
  const text = el.textContent ?? ''
  if (text.trim().length === 0) return noopHandle

  const originals = Array.from(el.childNodes)

  // Accessible copy — visually hidden inline (this chunk ships no CSS).
  const sr = document.createElement('span')
  sr.textContent = text
  Object.assign(sr.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: '0',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  const anim = document.createElement('span')
  anim.setAttribute('aria-hidden', 'true')
  anim.dataset.focusCascade = ''
  // Words become relative spans; the whitespace between them stays as plain
  // text nodes OUTSIDE the spans, where it collapses exactly as it did in the
  // original inline run.
  const words: HTMLElement[] = []
  const parts = text.split(/(\s+)/)
  for (const part of parts) {
    if (part.length === 0) continue
    if (/\s/.test(part)) {
      anim.appendChild(document.createTextNode(part))
      continue
    }
    const span = document.createElement('span')
    span.dataset.focusCascadeWord = ''
    span.style.position = 'relative'
    span.textContent = part
    anim.appendChild(span)
    words.push(span)
  }
  el.replaceChildren(sr, anim)

  gsap.set(words, { opacity: SOFT_OPACITY, top: SOFT_RISE, filter: `blur(${SOFT_BLUR}px)` })

  const stagger = Math.min(
    options.stagger ?? STAGGER,
    (options.maxDuration ?? MAX_DURATION) / words.length,
  )
  const tween = gsap.to(words, {
    opacity: 1,
    top: 0,
    filter: 'blur(0px)',
    duration: tokenDuration('lg') || 0.35,
    ease: 'token-drama',
    stagger,
    delay: options.delay ?? DELAY,
    onComplete: () => options.onComplete?.(),
  })

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      tween.kill()
      el.replaceChildren(...originals)
    },
  }
}
