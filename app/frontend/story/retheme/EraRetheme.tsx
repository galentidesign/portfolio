import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSkin } from '@/shell/skin/SkinProvider'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import {
  defaultSkin,
  skinNames,
  skins,
  SKIN_STORAGE_KEY,
  type SkinName,
} from '@/ds/tokens/generated/skins'
import type { RethemeMotionHandle } from './motion'
import styles from './retheme.module.css'

export interface EraRethemeProps {
  /** The era skin this story boundary applies while mounted. */
  skin: SkinName
  /** Screen-reader announcement after the swap. Defaults to "Theme: <label>". */
  announce?: string
  /** Font families to warm on mount so era type is resident before the swap. */
  warmFonts?: readonly string[]
  /**
   * HUD caption the era-crossing band types out mid-travel (decorative,
   * aria-hidden). Defaults to "loading <label>…".
   */
  caption?: string
  children: ReactNode
}

function isSkinName(value: string | null | undefined): value is SkinName {
  return value != null && (skinNames as readonly string[]).includes(value)
}

function currentSkinAttr(): SkinName {
  const attr = document.documentElement.dataset.skin
  return isSkinName(attr) ? attr : (defaultSkin.name as SkinName)
}

function readStoredSkin(): string | null {
  try {
    return localStorage.getItem(SKIN_STORAGE_KEY)
  } catch {
    return null
  }
}

/**
 * Story-driven re-theme boundary (spec §6.2) — applies an era skin for the
 * lifetime of the chapter and restores the visitor's skin on exit. See
 * story/retheme/README.md for the persistence contract and the pinned
 * choreography. Never persists: a story re-theme must not clobber the
 * visitor's explicit skin choice.
 */
export function EraRetheme({ skin, announce, warmFonts, caption, children }: EraRethemeProps) {
  const { setSkin } = useSkin()
  const { reduced } = useMotionPref()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const swappedRef = useRef(false)
  const [announced, setAnnounced] = useState('')

  // setSkin is a fresh closure each provider render; effects reach it through
  // a latest-callback ref (assigned in an effect, never during render) so
  // their dep arrays stay [skin]-shaped.
  const setSkinRef = useRef(setSkin)
  useEffect(() => {
    setSkinRef.current = setSkin
  })

  const label = skins.find((s) => s.name === skin)?.label ?? skin
  const message = announce ?? `Theme: ${label}`
  const captionText = caption ?? `loading ${label.toLowerCase()}…`

  // Entry/exit bookkeeping — the persistence contract (README).
  useEffect(() => {
    swappedRef.current = false
    const savedSkin = currentSkinAttr()
    const storedAtMount = readStoredSkin()

    return () => {
      // An explicit switch away mid-chapter wins: restore only while the
      // story's skin is still the active one. Read the live attribute —
      // context values are stale inside unmount cleanups.
      if (document.documentElement.dataset.skin !== skin) return
      const storedNow = readStoredSkin()
      const storedChangedDuringChapter = storedNow !== storedAtMount
      const target = storedChangedDuringChapter && isSkinName(storedNow) ? storedNow : savedSkin
      setSkinRef.current(target, { persist: false })
    }
  }, [skin])

  // Font warm-up (both modes): the era type must be resident before the swap.
  useEffect(() => {
    if (warmFonts === undefined || typeof document.fonts?.load !== 'function') return
    for (const family of warmFonts) {
      document.fonts.load(`1em '${family}'`).catch(() => {})
      document.fonts.load(`700 1em '${family}'`).catch(() => {})
    }
  }, [warmFonts])

  // The swap itself — THE MOTION GATE decides when, never whether.
  useEffect(() => {
    if (swappedRef.current) return
    if (document.documentElement.dataset.skin === skin) {
      // Already era-skinned at entry (deep link / explicit prior choice):
      // nothing to choreograph, nothing to announce.
      return
    }

    const performSwap = () => {
      if (swappedRef.current) return
      swappedRef.current = true
      setSkinRef.current(skin, { persist: false })
      setAnnounced(message)
    }

    if (reduced) {
      performSwap()
      return
    }

    // Motion enhancement by dynamic import: reduced-motion visitors never
    // download GSAP (same shape as the assembly opening).
    let cancelled = false
    let handle: RethemeMotionHandle | null = null
    void import('./motion')
      .then(({ mountRethemeMotion }) => {
        if (cancelled || containerRef.current === null) return
        handle = mountRethemeMotion(containerRef.current, { onSwap: performSwap })
      })
      .catch(() => {
        // The moment is never lost to a chunk error: swap instantly.
        if (!cancelled) performSwap()
      })

    return () => {
      cancelled = true
      handle?.destroy()
      handle = null
      // A live flip to reduced motion mid-sweep must still complete the
      // re-theme; the effect re-runs and takes the instant path above.
    }
  }, [skin, reduced, message])

  return (
    <div ref={containerRef} data-testid="era-retheme" data-era-skin={skin}>
      {/* Era-crossing band: inert at rest (opacity 0, pointer-events none) —
          only the motion layer ever shows or moves it. The interior binds to
          the ERA skin's night zone (data-skin + data-zone on one element), so
          the crossing frame renders in the destination era's CRT palette even
          while the page around it still wears the outgoing skin. */}
      <div aria-hidden="true" data-retheme-band className={styles.band}>
        <div className={styles['band-interior']} data-skin={skin} data-zone="night">
          <p className={styles['band-caption']}>
            {Array.from(captionText).map((char, i) => (
              <span key={i} data-retheme-caption-char>
                {char}
              </span>
            ))}
          </p>
        </div>
      </div>
      <div role="status" className={styles['sr-announce']}>
        {announced}
      </div>
      {children}
    </div>
  )
}
