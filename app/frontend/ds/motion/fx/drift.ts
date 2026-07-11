// Particle atmosphere — the kilnlight chip rain, matured (design-direction §5a).
// Where the retired Physics2D rain poured token chips through the assembly
// pin, this drift is ambient: a handful of motes wandering (bone) or rising
// (ember) inside a host box, deterministic per index so runs reproduce.
// Same discipline as the original: motes exist only in motion mode (the base
// render never carries them), the holder is aria-hidden, and every style is
// written inline off semantic tokens — this chunk stays CSS-free (the
// keyframes ride a scoped <style> the mount owns). Inside a
// data-zone="night" island the same accent vars resolve to embers on their
// own; the preset only tunes count, scale, and motion.
//
// COMPOSITOR-ONLY on purpose: an atmosphere that idles on screen (the
// liftoff beat is the LCP viewport) must cost the main thread nothing — a
// rAF/ticker drift bills continuous style work that Lighthouse charges
// straight against the route. CSS transform/opacity animations run on the
// compositor; browsers throttle them offscreen for free.
import type { FxHandle } from './types'

export type DriftPreset = 'bone' | 'ember'

export interface DriftOptions {
  preset?: DriftPreset
  /** Mote count override — presets default restrained (9 / 12). */
  count?: number
}

interface PresetConfig {
  count: number
  /** CSS length for the base mote size (scaled ±30% by index). */
  size: string
  /** Semantic color tokens cycled across motes. */
  colors: readonly string[]
  opacity: number
  /** 'wander' anchors each mote; 'rise' climbs and wraps (embers). */
  mode: 'wander' | 'rise'
  /** Horizontal sway amplitude in px. */
  sway: number
  /** Seconds per sway period (varied ±35% by index). */
  period: number
  /** Seconds per full rise (rise mode; varied by index). */
  risePeriod: number
}

const PRESETS: Record<DriftPreset, PresetConfig> = {
  bone: {
    count: 9,
    size: 'var(--space-2)',
    colors: ['--color-line-strong', '--color-accent-muted', '--color-line'],
    opacity: 0.5,
    mode: 'wander',
    sway: 22,
    period: 13,
    risePeriod: 0,
  },
  ember: {
    count: 12,
    size: 'var(--space-1)',
    colors: ['--color-accent', '--color-glow-ink', '--color-accent-muted'],
    opacity: 0.75,
    mode: 'rise',
    sway: 12,
    period: 8,
    risePeriod: 14,
  },
}

// Scopes concurrent mounts' keyframe names (deterministic per mount order —
// no randomness, so runs reproduce).
let instanceCounter = 0

export function mountDrift(host: HTMLElement, options: DriftOptions = {}): FxHandle {
  const preset = PRESETS[options.preset ?? 'bone']
  const count = options.count ?? preset.count
  const scope = `fx-drift-${instanceCounter++}`

  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  holder.dataset.fxDrift = options.preset ?? 'bone'
  Object.assign(holder.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
  })

  // Keyframes owned by this mount — transform/opacity only, every length a
  // fixed px/rem. No container units: a dynamic length inside an animated
  // transform de-composites the animation back onto the main thread, which
  // is exactly what this module exists to avoid. The rise travel is a
  // generous fixed distance; the island clips overflow and the opacity
  // envelope has faded the mote long before the top.
  const style = document.createElement('style')
  style.textContent = `
    @keyframes ${scope}-sway { from { transform: translateX(-${preset.sway}px) } to { transform: translateX(${preset.sway}px) } }
    @keyframes ${scope}-bob { from { transform: translateY(-${Math.round(preset.sway * 0.6)}px) } to { transform: translateY(${Math.round(preset.sway * 0.6)}px) } }
    @keyframes ${scope}-rise {
      0% { transform: translateY(0); opacity: 0 }
      12% { opacity: ${preset.opacity} }
      82% { opacity: ${preset.opacity} }
      100% { transform: translateY(-42rem); opacity: 0 }
    }
  `
  holder.appendChild(style)

  for (let i = 0; i < count; i++) {
    const scale = 0.6 + (i % 3) * 0.3
    // Two nested spans split the axes so each rides its own animation —
    // a lissajous wander (or rise + sway) with zero script per frame.
    const outer = document.createElement('span')
    const mote = document.createElement('span')
    mote.dataset.driftMote = ''

    const swayDuration = preset.period * (0.65 + ((i * 29) % 70) / 100)
    const swayDelay = (-((i * 37) % 100) / 100) * swayDuration

    Object.assign(outer.style, {
      position: 'absolute',
      left: `${(i * 37) % 100}%`,
      top: preset.mode === 'rise' ? '100%' : `${(i * 53) % 100}%`,
      animation:
        preset.mode === 'rise'
          ? `${scope}-rise ${preset.risePeriod * (0.6 + ((i * 41) % 80) / 100)}s linear ${-(((i * 53) % 100) / 100) * preset.risePeriod}s infinite`
          : `${scope}-bob ${swayDuration * 1.27}s ease-in-out ${swayDelay * 1.13}s infinite alternate`,
    })

    Object.assign(mote.style, {
      display: 'block',
      width: `calc(${preset.size} * ${scale})`,
      height: `calc(${preset.size} * ${scale})`,
      borderRadius: '50%',
      backgroundColor: `var(${preset.colors[i % preset.colors.length]})`,
      opacity: preset.mode === 'rise' ? '1' : `${preset.opacity}`,
      animation: `${scope}-sway ${swayDuration}s ease-in-out ${swayDelay}s infinite alternate`,
    })

    outer.appendChild(mote)
    holder.appendChild(outer)
  }
  host.appendChild(holder)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      holder.remove()
    },
  }
}
