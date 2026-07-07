/**
 * Night motion layer — the kilnlight choreography for Ch3's dark act.
 *
 * One lazy chunk for every GSAP moment inside the night zone:
 *   - NightBoundary: the ember horizon draws itself once as the band
 *     scrolls in (DrawSVG, from the centre outward — ignition, not a wipe)
 *   - Receipts feed: session cards rise in per scroll-enter batch; each
 *     card's title decodes once with ScrambleText. Content parity is
 *     absolute: the real title IS the DOM text — the tween scrambles toward
 *     it and teardown restores it verbatim.
 *   - OrchestrationMap: edges draw in (DrawSVG), nodes pulse in staggered,
 *     then two agent nodes ride a slow micro-orbit (≥2s period, finite laps).
 *
 * Scroll-enter triggers are IntersectionObservers (the fx/reveal.ts idiom),
 * NOT ScrollTrigger: the budget math in scripts/perf/bundle-budget.mjs bills
 * the shared gsap core chunk (~27kB gz) to this feature already, and
 * ScrollTrigger (~14kB gz) would push the payload past the 45kB budget.
 * Every observer fires once and disconnects; every tween is finite — nothing
 * ticks after the zone settles (WCAG 2.3.1: no strobe, single passes only).
 *
 * Reduced motion never loads this module (THE MOTION GATE); the base render
 * is the complete design — bridge fully ramped, horizon pre-drawn, feed and
 * map static and legible.
 */
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { registerTokenEases, tokenDuration } from '@/ds/motion/gsapPlugins'

export interface NightMotionHandle {
  /** Kill tweens/observers and return the subtree to its base render. */
  destroy(): void
}

gsap.registerPlugin(DrawSVGPlugin, ScrambleTextPlugin, MotionPathPlugin)

const inertHandle = (): NightMotionHandle => ({ destroy: () => {} })

/** Terminal-decode glyph set for the scramble (mono-safe ASCII only). */
const SCRAMBLE_CHARS = '<>-_\\/[]{}=+*^#'

/** Seconds between successive cards in one scroll-enter batch. */
const FEED_STAGGER = 0.08

/** Micro-orbit paths (px, relative) — ~2.4px radius, closing back at rest. */
const ORBITS: ReadonlyArray<ReadonlyArray<{ x: number; y: number }>> = [
  [
    { x: 1.8, y: -1.2 },
    { x: 0, y: -2.4 },
    { x: -1.8, y: -1.2 },
    { x: 0, y: 0 },
  ],
  [
    { x: -1.6, y: 1.1 },
    { x: 0, y: 2.2 },
    { x: 1.6, y: 1.1 },
    { x: 0, y: 0 },
  ],
]

/** True when the element has yet to enter the viewport (fx/reveal.ts rule):
 * anything already on screen at mount keeps its base render — no flicker. */
function offScreen(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.top >= window.innerHeight || rect.bottom <= 0
}

/** Observe once: fire `enter` on first intersection, then disconnect. */
function onEnterOnce(el: Element, rootMargin: string, enter: () => void): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      enter()
    },
    { rootMargin },
  )
  io.observe(el)
  return () => io.disconnect()
}

// ── NightBoundary: ember horizon draw ────────────────────────────────────────

export function mountBoundaryMotion(root: HTMLElement): NightMotionHandle {
  const line = root.querySelector<SVGPathElement>('[data-night-horizon]')
  if (line === null || typeof IntersectionObserver === 'undefined' || !offScreen(root)) {
    return inertHandle()
  }
  registerTokenEases()

  // Zero-length dash from the centre — invisible until the draw ignites it.
  gsap.set(line, { drawSVG: '50% 50%' })

  let tween: gsap.core.Tween | null = null
  const disconnect = onEnterOnce(root, '0px 0px -18% 0px', () => {
    tween = gsap.to(line, {
      drawSVG: '0% 100%',
      duration: tokenDuration('xl') || 0.65,
      ease: 'token-enter',
    })
  })

  return {
    destroy() {
      disconnect()
      tween?.kill()
      gsap.set(line, { clearProps: 'all' })
    },
  }
}

// ── Receipts feed: rise-in + title decode ────────────────────────────────────

export function mountFeedMotion(container: HTMLElement): NightMotionHandle {
  const cards = Array.from(container.querySelectorAll<HTMLElement>('[data-receipt-card]'))
  const pending = cards.filter(offScreen)
  if (pending.length === 0 || typeof IntersectionObserver === 'undefined') {
    return inertHandle()
  }
  registerTokenEases()

  // The card title's REAL text, captured up front: the scramble tween decodes
  // toward it, and teardown restores it — content parity by construction.
  const titles = new Map<HTMLElement, { el: HTMLElement; text: string }>()
  for (const card of pending) {
    const el = card.querySelector<HTMLElement>('[data-receipt-title]')
    if (el?.textContent) titles.set(card, { el, text: el.textContent })
  }

  gsap.set(pending, { y: 16, opacity: 0 })

  const remaining = new Set(pending)
  const tweens: gsap.core.Tween[] = []
  const io = new IntersectionObserver(
    (entries) => {
      const batch = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .filter((el) => remaining.has(el))
        .sort((a, b) => cards.indexOf(a) - cards.indexOf(b))
      if (batch.length === 0) return

      const rise = tokenDuration('lg') || 0.4
      batch.forEach((card, i) => {
        remaining.delete(card)
        io.unobserve(card)
        tweens.push(
          gsap.to(card, {
            y: 0,
            opacity: 1,
            duration: rise,
            delay: i * FEED_STAGGER,
            ease: 'token-enter',
            // Hand styles back to the cascade once settled.
            clearProps: 'transform,opacity',
          }),
        )
        const title = titles.get(card)
        if (title) {
          tweens.push(
            gsap.to(title.el, {
              duration: tokenDuration('xl') || 0.65,
              delay: i * FEED_STAGGER,
              scrambleText: { text: title.text, chars: SCRAMBLE_CHARS, speed: 0.4 },
            }),
          )
        }
      })
      if (remaining.size === 0) io.disconnect()
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  for (const card of pending) io.observe(card)

  return {
    destroy() {
      io.disconnect()
      for (const tween of tweens) tween.kill()
      gsap.killTweensOf(pending)
      gsap.set(pending, { clearProps: 'transform,opacity' })
      for (const { el, text } of titles.values()) el.textContent = text
    },
  }
}

// ── OrchestrationMap: edge draw + node pulse-in + micro-orbit ────────────────

export function mountOrchestrationMotion(figure: HTMLElement): NightMotionHandle {
  const edges = Array.from(figure.querySelectorAll<SVGPathElement>('[data-orch-edge]'))
  const nodes = Array.from(figure.querySelectorAll<SVGGElement>('[data-orch-node]'))
  const orbiters = Array.from(figure.querySelectorAll<SVGGElement>('[data-orch-orbit]'))
  if (
    (edges.length === 0 && nodes.length === 0) ||
    typeof IntersectionObserver === 'undefined' ||
    !offScreen(figure)
  ) {
    return inertHandle()
  }
  registerTokenEases()

  if (edges.length > 0) gsap.set(edges, { drawSVG: '0%' })
  if (nodes.length > 0) gsap.set(nodes, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' })

  let tl: gsap.core.Timeline | null = null
  const disconnect = onEnterOnce(figure, '0px 0px -15% 0px', () => {
    tl = gsap.timeline()
    if (nodes.length > 0) {
      tl.to(
        nodes,
        {
          opacity: 1,
          scale: 1,
          duration: tokenDuration('lg') || 0.4,
          ease: 'token-spring',
          stagger: 0.12,
        },
        0,
      )
    }
    if (edges.length > 0) {
      tl.to(
        edges,
        {
          drawSVG: '0% 100%',
          duration: tokenDuration('md') || 0.24,
          ease: 'token-move',
          stagger: 0.08,
        },
        0.25,
      )
    }
    // Micro-orbit: subtle, slow (≥2s period), FINITE — three laps each, then
    // the map is fully static; nothing keeps ticking after settle.
    orbiters.forEach((node, i) => {
      tl?.to(
        node,
        {
          motionPath: { path: [...ORBITS[i % ORBITS.length]], curviness: 1.5 },
          duration: 2.6 + i * 0.7,
          repeat: 2,
          ease: 'none',
        },
        1.1,
      )
    })
  })

  return {
    destroy() {
      disconnect()
      tl?.kill()
      const all: Element[] = [...edges, ...nodes]
      if (all.length > 0) gsap.set(all, { clearProps: 'all' })
    },
  }
}
