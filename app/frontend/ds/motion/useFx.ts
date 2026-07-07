import { useEffect, useRef, type RefObject } from 'react'
import { useMotionPref } from './useMotionPref'
import type { FxHandle } from './fx/types'

/** The fx barrel's namespace, handed to the mount callback once loaded. */
export type FxApi = typeof import('./fx')

/**
 * THE MOTION GATE for the fx layer (JS counterpart: useMotionPref). Returns
 * a ref to attach to the target element. In motion mode the fx barrel is
 * dynamically imported on first eligible mount — reduced-motion visitors
 * download zero fx bytes — and `mount` runs with the loaded namespace:
 *
 *   const ref = useFx<HTMLAnchorElement>((fx, el) => fx.mountProximityGlow(el))
 *
 * The returned handle is destroyed on unmount or on a live flip to reduced
 * motion, returning the element to its base-styled render.
 */
export function useFx<T extends HTMLElement>(
  mount: (fx: FxApi, el: T) => FxHandle,
): RefObject<T | null> {
  const ref = useRef<T>(null)
  const { reduced } = useMotionPref()

  // Latest-callback ref (assembly-opening pattern) so the import closure
  // always sees the current callback without re-running the effect.
  const mountRef = useRef(mount)
  useEffect(() => {
    mountRef.current = mount
  })

  useEffect(() => {
    if (reduced || ref.current === null) return

    let cancelled = false
    let handle: FxHandle | null = null
    void import('./fx').then((fx) => {
      if (cancelled || ref.current === null) return
      handle = mountRef.current(fx, ref.current)
    })

    return () => {
      cancelled = true
      handle?.destroy()
      handle = null
    }
  }, [reduced])

  return ref
}
