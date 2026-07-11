// Particle atmosphere — the kilnlight chip rain, matured (design-direction §5a).
// Where the retired Physics2D rain poured token chips through the assembly
// pin, this drift is ambient: a handful of motes wandering (bone) or rising
// (ember) inside a host box, deterministic per index so runs reproduce.
// Same discipline as the original: motes exist only in motion mode (the base
// render never carries them), the holder is aria-hidden, and every style is
// written inline off semantic tokens — this chunk stays CSS-free. Inside a
// data-zone="night" island the same accent vars resolve to embers on their
// own; the preset only tunes count, scale, and motion.
// Pauses offscreen (IntersectionObserver) and in hidden tabs, like marquee.
import { gsap } from './runtime'
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
  /** Vertical rise in px/s; 0 = anchored wander (bone). */
  rise: number
  /** Horizontal sway amplitude in px. */
  sway: number
  /** Seconds per sway period. */
  period: number
}

const PRESETS: Record<DriftPreset, PresetConfig> = {
  bone: {
    count: 9,
    size: 'var(--space-2)',
    colors: ['--color-line-strong', '--color-accent-muted', '--color-line'],
    opacity: 0.5,
    rise: 0,
    sway: 22,
    period: 13,
  },
  ember: {
    count: 12,
    size: 'var(--space-1)',
    colors: ['--color-accent', '--color-glow-ink', '--color-accent-muted'],
    opacity: 0.75,
    rise: 26,
    sway: 12,
    period: 8,
  },
}

const GOLDEN = 2.399963 // radians — spreads phases without repetition

/**
 * Mount the drift atmosphere inside `host` (which must establish a containing
 * block — position: relative or better). Returns the standard fx handle.
 */
export function mountDrift(host: HTMLElement, options: DriftOptions = {}): FxHandle {
  const preset = PRESETS[options.preset ?? 'bone']
  const count = options.count ?? preset.count

  const holder = document.createElement('div')
  holder.setAttribute('aria-hidden', 'true')
  holder.dataset.fxDrift = options.preset ?? 'bone'
  Object.assign(holder.style, {
    position: 'absolute',
    inset: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
  })

  interface Mote {
    el: HTMLElement
    setX: (v: number) => void
    setY: (v: number) => void
    anchorX: number // fraction of host width
    anchorY: number // fraction of host height
    phase: number
    scale: number
  }

  const motes: Mote[] = []
  for (let i = 0; i < count; i++) {
    const mote = document.createElement('span')
    mote.dataset.driftMote = ''
    const scale = 0.6 + (i % 3) * 0.3
    Object.assign(mote.style, {
      position: 'absolute',
      width: `calc(${preset.size} * ${scale})`,
      height: `calc(${preset.size} * ${scale})`,
      borderRadius: '50%',
      backgroundColor: `var(${preset.colors[i % preset.colors.length]})`,
      opacity: `${preset.opacity}`,
      left: '0',
      top: '0',
      willChange: 'transform',
    })
    holder.appendChild(mote)
    motes.push({
      el: mote,
      setX: gsap.quickSetter(mote, 'x', 'px') as (v: number) => void,
      setY: gsap.quickSetter(mote, 'y', 'px') as (v: number) => void,
      anchorX: ((i * 37) % 100) / 100,
      anchorY: ((i * 53) % 100) / 100,
      phase: i * GOLDEN,
      scale,
    })
  }
  host.appendChild(holder)

  // Host box cached; re-read on resize only (never per tick).
  let width = 0
  let height = 0
  const measure = (): void => {
    const rect = host.getBoundingClientRect()
    width = rect.width
    height = rect.height
  }
  measure()
  window.addEventListener('resize', measure)

  let elapsed = 0
  const tick = (_time: number, deltaTime: number): void => {
    elapsed += deltaTime / 1000
    if (width <= 0 || height <= 0) return
    const omega = (Math.PI * 2) / preset.period
    for (const m of motes) {
      const swayX = preset.sway * Math.sin(elapsed * omega + m.phase)
      if (preset.rise === 0) {
        // Anchored wander — a slow lissajous around the mote's home point.
        const swayY = preset.sway * 0.6 * Math.cos(elapsed * omega * 0.8 + m.phase)
        m.setX(m.anchorX * width + swayX)
        m.setY(m.anchorY * height + swayY)
      } else {
        // Ember rise — climb, wrap at the top, fade through the edges.
        const travel = (m.anchorY * height + elapsed * preset.rise * m.scale) % height
        const y = height - travel
        m.setX(m.anchorX * width + swayX)
        m.setY(y)
        const edge = Math.min(travel / (height * 0.12), (height - travel) / (height * 0.18), 1)
        m.el.style.opacity = `${preset.opacity * Math.max(edge, 0)}`
      }
    }
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
  io.observe(host)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', measure)
      if (running) {
        running = false
        gsap.ticker.remove(tick)
      }
      holder.remove()
    },
  }
}
