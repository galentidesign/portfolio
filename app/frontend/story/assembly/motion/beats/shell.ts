/**
 * Beat 4 — shell (0.70–1.00). The payoff: the hero settles into its resting
 * place (never dimming), the facsimile bar slides up into the real bar's
 * position and crossfades out, the hatch pill pops in before dissolving with
 * the frame, and a handful of small token chips rains down under Physics2D
 * gravity toward the gateway below. What's left is the real shell — you're
 * inside it now.
 */
import type { BeatContext, Timeline } from '../timeline'

/** The hatch pill and inner bar are the frame's span/div children. */
const HATCH = ':scope > span'

const SCATTER_COUNT = 12
const SCATTER_COLORS = [
  '--color-accent',
  '--color-accent-muted',
  '--color-positive-surface',
  '--color-caution-surface',
  '--color-line',
  '--color-surface-sunken',
] as const

/**
 * Create the shell beat's scatter chips (motion mode only — the base render
 * never carries them). Called by the mount before initial states are applied;
 * returns the remover the mount calls on destroy. Positions are deterministic
 * so runs are reproducible.
 */
export function createScatterChips(section: HTMLElement): () => void {
  const step = section.querySelector<HTMLElement>('[data-beat="shell"]')
  if (!step) return () => {}

  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  // Attribute hooks, not module classes — assembly.module.css styles these
  // via `.opening [data-assembly-scatter]` so this chunk stays CSS-free.
  holder.dataset.assemblyScatter = ''

  for (let i = 0; i < SCATTER_COUNT; i++) {
    const chip = document.createElement('span')
    chip.dataset.scatterChip = ''
    chip.style.left = `${8 + ((i * 37) % 80)}%`
    chip.style.top = `${-4 - ((i * 11) % 14)}%`
    chip.style.backgroundColor = `var(${SCATTER_COLORS[i % SCATTER_COLORS.length]})`
    holder.appendChild(chip)
  }

  step.appendChild(holder)
  return () => holder.remove()
}

export function setInitial(ctx: BeatContext): void {
  const { set } = ctx

  // The hero is visible from frame one and only ever eases home — opacity 1.
  const hero = ctx.hero()
  if (hero) set(hero, { opacity: 1, y: 22, scale: 1.035, transformOrigin: '50% 50%' })

  // Conveyor entrance to match the other beats; the shell never exits.
  const step = ctx.step('shell')
  if (step) set(step, { opacity: 0, y: 56 })

  const frame = ctx.part('shell', 'frame')
  if (frame) set(frame, { opacity: 0, y: 38 })

  const hatch = frame ? ctx.child(frame, HATCH) : null
  if (hatch) set(hatch, { opacity: 0, scale: 0.82, transformOrigin: '50% 50%' })

  const chips = ctx.parts('shell', '[data-scatter-chip]')
  if (chips.length)
    set(chips, { opacity: 0, scale: (i: number) => 0.7 + (i % 3) * 0.3 })
}

export function addToTimeline(tl: Timeline, ctx: BeatContext): void {
  const { ease, lead } = ctx
  const { start, end } = ctx.span('shell')
  // Half the lead — the previous exit owns the first half (see atom.ts).
  const entrance = Math.max(0, start - lead / 2)

  const hero = ctx.hero()
  const step = ctx.step('shell')
  const frame = ctx.part('shell', 'frame')
  const hatch = frame ? ctx.child(frame, HATCH) : null
  const chips = ctx.parts('shell', '[data-scatter-chip]')

  if (step) tl.to(step, { opacity: 1, y: 0, duration: 8, ease: ease.enter }, entrance)
  // The hero settles home — translate/scale only, never a fade. Ends before
  // the frame's exit begins in earnest: overlapping both with the facsimile
  // crossfade stacked paint past the §9.3 budget.
  if (hero) tl.to(hero, { y: 0, scale: 1, duration: 14, ease: ease.land }, start)
  // The facsimile bar arrives with weight...
  if (frame) tl.to(frame, { opacity: 1, y: 0, duration: 7, ease: ease.drama }, start)
  // ...the hatch pill springs in...
  if (hatch) tl.to(hatch, { opacity: 1, scale: 1, duration: 5, ease: ease.spring }, start + 6)
  // ...then the whole frame slides to the real bar's position and crossfades
  // out (the hatch, its child, dissolves with it). The hero remains: the shell.
  if (frame) tl.to(frame, { opacity: 0, y: -64, duration: 10, ease: ease.exit }, start + 12)

  // Token-chip rain: each chip pops on, then falls under Physics2D gravity
  // toward the gateway below the pin, settling out of frame before the
  // release so nothing is mid-flight at the handoff.
  if (chips.length) {
    tl.to(chips, { opacity: 1, duration: 1.5, stagger: 0.5, ease: ease.enter }, start + 4)
    tl.to(
      chips,
      {
        duration: 18,
        physics2D: {
          velocity: 'random(10, 24)',
          angle: 'random(70, 110)',
          gravity: 3,
        },
        rotation: 'random(-70, 70)',
        ease: 'none',
        stagger: 0.5,
      },
      start + 4,
    )
    tl.to(chips, { opacity: 0, duration: 4, stagger: 0.2, ease: ease.exit }, end - 9)
  }
}
