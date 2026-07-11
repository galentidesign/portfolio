// Kinetic type — key statements write themselves (design-direction §5b).
// The static base render carries the full text (fallback-as-base: reduced
// motion and SEO read the finished statement); this mount replaces it with a
// visually-hidden accessible copy plus aria-hidden per-char spans, then
// reveals the chars on the gsap ticker. Kin to the retheme caption type-out:
// per-char opacity, layout pre-measured, zero reflow, no blink — the caret is
// a data attribute (`data-caret` on the last revealed char) the consumer
// draws with static CSS. destroy() restores the original DOM.
import { gsap } from './runtime'
import type { FxHandle } from './types'
import { noopHandle } from './runtime'

export interface TypewriterOptions {
  /** Seconds per character, upper bound — long text compresses (default 0.045). */
  charInterval?: number
  /** Ceiling for the whole write-in, seconds (default 1.6). */
  maxDuration?: number
  /** Seconds to hold before the first character (default 0.15). */
  delay?: number
  onComplete?: () => void
}

const CHAR_INTERVAL = 0.045
const MAX_DURATION = 1.6
const DELAY = 0.15

export function mountTypewriter(el: HTMLElement, options: TypewriterOptions = {}): FxHandle {
  const text = el.textContent ?? ''
  if (text.length === 0) return noopHandle

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
  anim.dataset.typewriter = ''
  const chars: HTMLElement[] = []
  for (const char of Array.from(text)) {
    const span = document.createElement('span')
    span.dataset.typewriterChar = ''
    span.textContent = char
    span.style.opacity = '0'
    anim.appendChild(span)
    chars.push(span)
  }
  el.replaceChildren(sr, anim)

  const interval = Math.min(
    options.charInterval ?? CHAR_INTERVAL,
    (options.maxDuration ?? MAX_DURATION) / chars.length,
  )
  const delay = options.delay ?? DELAY

  let elapsed = 0
  let revealed = 0
  let caretOn: HTMLElement | null = null
  let done = false

  const tick = (_time: number, deltaTime: number): void => {
    elapsed += deltaTime / 1000
    const due = Math.min(Math.max(Math.floor((elapsed - delay) / interval), 0), chars.length)
    while (revealed < due) {
      chars[revealed].style.opacity = '1'
      revealed++
    }
    if (revealed > 0) {
      const current = chars[revealed - 1]
      if (caretOn !== current) {
        caretOn?.removeAttribute('data-caret')
        current.setAttribute('data-caret', '')
        caretOn = current
      }
    }
    if (revealed === chars.length && !done) {
      done = true
      gsap.ticker.remove(tick)
      caretOn?.removeAttribute('data-caret')
      caretOn = null
      options.onComplete?.()
    }
  }
  gsap.ticker.add(tick)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      gsap.ticker.remove(tick)
      el.replaceChildren(...originals)
    },
  }
}
