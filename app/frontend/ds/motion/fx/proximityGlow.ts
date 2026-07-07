// Proximity glow — writes --glow-x/--glow-y (percent across the element) and
// --glow-a (0–1 proximity alpha) custom props via gsap.quickSetter. The paint
// layer lives in the consumer's stylesheet (e.g. Card's [data-fx-glow]::after)
// so this module stays pure math + custom props.
//
// The mount also owns the [data-fx-glow] marker: it appears only while the fx
// layer is live, so reduced-motion visitors never even grow the paint layer.
// Pointer listeners are scoped by an IntersectionObserver — an offscreen
// element costs zero listeners.
import { gsap, hasFinePointer, noopHandle } from './runtime'
import type { FxHandle } from './types'

const REACH = 160 // px beyond the element's edge where the glow starts waking

const GLOW_PROPS = ['--glow-x', '--glow-y', '--glow-a'] as const

export function mountProximityGlow(el: HTMLElement): FxHandle {
  if (!hasFinePointer()) return noopHandle

  el.setAttribute('data-fx-glow', '')
  const set = gsap.quickSetter(el, 'css') as (vars: Record<string, string | number>) => void

  const onPointerMove = (e: PointerEvent): void => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = gsap.utils.clamp(0, 100, ((e.clientX - rect.left) / rect.width) * 100)
    const y = gsap.utils.clamp(0, 100, ((e.clientY - rect.top) / rect.height) * 100)
    const edgeX = Math.max(0, Math.abs(e.clientX - (rect.left + rect.width / 2)) - rect.width / 2)
    const edgeY = Math.max(0, Math.abs(e.clientY - (rect.top + rect.height / 2)) - rect.height / 2)
    const a = Math.max(0, 1 - Math.hypot(edgeX, edgeY) / REACH)
    set({ '--glow-x': `${x}%`, '--glow-y': `${y}%`, '--glow-a': a })
  }

  let listening = false
  const listen = (): void => {
    if (listening) return
    listening = true
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }
  const unlisten = (): void => {
    if (!listening) return
    listening = false
    window.removeEventListener('pointermove', onPointerMove)
    set({ '--glow-a': 0 })
  }

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) listen()
    else unlisten()
  })
  io.observe(el)

  let destroyed = false

  return {
    destroy(): void {
      if (destroyed) return
      destroyed = true
      io.disconnect()
      unlisten()
      el.removeAttribute('data-fx-glow')
      for (const prop of GLOW_PROPS) el.style.removeProperty(prop)
    },
  }
}
