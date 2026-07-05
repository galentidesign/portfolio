import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'
import { MOTION_STORAGE_KEY } from '@/ds/tokens/generated/skins'

interface MotionPrefContextValue {
  /** True when the OS or the user's manual toggle requests reduced motion. */
  reduced: boolean
  /** True only when the user explicitly toggled reduced-motion (not just OS preference). */
  manualReduced: boolean
  setManualReduced: (v: boolean) => void
}

const MotionPrefContext = createContext<MotionPrefContextValue | null>(null)

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToMotionMedia(callback: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function getMotionServerSnapshot(): boolean {
  // No SSR, but React's concurrent mode requires this for useSyncExternalStore.
  return false
}

export function MotionPrefProvider({ children }: { children: ReactNode }) {
  const osReduced = useSyncExternalStore(
    subscribeToMotionMedia,
    getMotionSnapshot,
    getMotionServerSnapshot,
  )

  const [manualReduced, setManualReducedState] = useState<boolean>(
    () => document.documentElement.dataset.motion === 'reduced',
  )

  const setManualReduced = (v: boolean) => {
    if (v) {
      document.documentElement.dataset.motion = 'reduced'
      try {
        localStorage.setItem(MOTION_STORAGE_KEY, 'reduced')
      } catch {
        // private mode or storage quota exceeded
      }
    } else {
      delete document.documentElement.dataset.motion
      try {
        localStorage.removeItem(MOTION_STORAGE_KEY)
      } catch {
        // private mode or storage quota exceeded
      }
    }
    setManualReducedState(v)
  }

  const reduced = osReduced || manualReduced

  return (
    <MotionPrefContext.Provider value={{ reduced, manualReduced, setManualReduced }}>
      {children}
    </MotionPrefContext.Provider>
  )
}

/**
 * THE MOTION GATE — per repo rules no animation code may bypass this hook.
 * Gate all JS animation logic behind `reduced`: when true, skip or collapse
 * the animation. The CSS layer is handled by `motion-overrides.css`; this
 * hook is the JS counterpart.
 *
 * Returns:
 *   - `reduced`: true when OS prefers-reduced-motion OR user manually enabled it
 *   - `manualReduced`: true only when the user explicitly toggled via setManualReduced
 *   - `setManualReduced`: persist the user's manual choice to data-motion attr + localStorage
 *
 * Must be called within a <MotionPrefProvider> — throws otherwise.
 */
export function useMotionPref(): MotionPrefContextValue {
  const ctx = useContext(MotionPrefContext)
  if (ctx === null) {
    throw new Error('useMotionPref must be called within a <MotionPrefProvider>')
  }
  return ctx
}
