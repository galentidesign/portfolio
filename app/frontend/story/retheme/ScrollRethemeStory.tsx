import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
import { activeSegment, type ScrollBoundary } from './scrollStory'
import styles from './retheme.module.css'

/**
 * Prefetch the crossing choreography when the nearest boundary is within
 * this many viewports of the reference line — far enough that the chunk
 * usually beats the scroll, close enough that top-of-page visits (the LCP
 * moment) never pay for it.
 */
const PREFETCH_VIEWPORTS = 1.5

interface ScrollRethemeContextValue {
  register: (boundary: ScrollBoundary) => () => void
  /** The story's ground skin — the visitor's own, adopted live on explicit re-picks. */
  baseSkin: SkinName
  /**
   * True once the viewport has come within the prefetch horizon of the first
   * boundary. Boundaries dress their bands and warm era fonts on this signal
   * — never at load, so the LCP viewport pays nothing for crossings that sit
   * viewports below the fold.
   */
  approached: boolean
}

const ScrollRethemeContext = createContext<ScrollRethemeContextValue | null>(null)

export function useScrollRethemeStory(): ScrollRethemeContextValue {
  const ctx = useContext(ScrollRethemeContext)
  if (ctx === null) {
    throw new Error('useScrollRethemeStory must be called within a <ScrollRethemeStory>')
  }
  return ctx
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

const labelOf = (skin: SkinName): string => skins.find((s) => s.name === skin)?.label ?? skin

/**
 * Scroll-driven re-theme ladder — EraRetheme's persistence contract, promoted
 * to a single continuous page (spec: design-direction.md, Home-as-Story).
 *
 * Wraps the whole story; <ScrollRetheme> boundaries between beats register
 * here. One rAF-throttled scroll listener decides the active segment (the
 * last boundary whose marker sits above the viewport centre) and applies its
 * skin — via the era-crossing band going down, instantly going up (scrubbing
 * back is navigation, not narrative) and always instantly under reduced
 * motion. The contract carried over verbatim from EraRetheme:
 *
 * - never writes localStorage; every swap is setSkin(..., { persist: false })
 * - an explicit visitor re-pick mid-story wins — the ladder adopts it as the
 *   new base and never fights it within the current segment
 * - unmount restores the entry skin, unless storage changed mid-story (the
 *   visitor persisted a choice — that wins) or the live skin is no longer
 *   ladder-applied (switch-away wins)
 * - reduced-motion visitors never download the motion chunk (prefetch is
 *   gated on the live preference)
 */
export function ScrollRethemeStory({ children }: { children: ReactNode }) {
  const { setSkin } = useSkin()
  const { reduced } = useMotionPref()
  const [announced, setAnnounced] = useState('')
  const [approached, setApproached] = useState(false)
  // Ground skin as state so sweep-home bands re-render on adoption; mirrored
  // into a ref for the scroll handler.
  const [baseSkin, setBaseSkin] = useState<SkinName>(() => currentSkinAttr())

  const boundariesRef = useRef<ScrollBoundary[]>([])
  const baseSkinRef = useRef<SkinName>(baseSkin)
  const storedAtMountRef = useRef<string | null>(null)
  /** Last skin the ladder itself applied; null until the first application. */
  const appliedRef = useRef<SkinName | null>(null)
  const segmentRef = useRef<number>(-1)
  const reducedRef = useRef(reduced)
  const handleRef = useRef<RethemeMotionHandle | null>(null)
  const motionModRef = useRef<typeof import('./motion') | null>(null)
  const prefetchRef = useRef<'idle' | 'started' | 'failed'>('idle')

  const setSkinRef = useRef(setSkin)
  useEffect(() => {
    setSkinRef.current = setSkin
  })
  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  const register = useCallback((boundary: ScrollBoundary) => {
    const list = boundariesRef.current
    list.push(boundary)
    // Keep document order — markers register from child effects whose order
    // React does not guarantee across re-renders.
    list.sort((a, b) =>
      a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    return () => {
      const at = boundariesRef.current.indexOf(boundary)
      if (at !== -1) boundariesRef.current.splice(at, 1)
    }
  }, [])

  useEffect(() => {
    storedAtMountRef.current = readStoredSkin()
    const referenceLine = () => window.innerHeight / 2

    const destroyHandle = () => {
      handleRef.current?.destroy()
      handleRef.current = null
    }

    const applyInstant = (target: SkinName, message: string) => {
      setSkinRef.current(target, { persist: false })
      appliedRef.current = target
      setAnnounced(message)
    }

    const process = () => {
      const boundaries = boundariesRef.current
      if (boundaries.length === 0) return

      // An explicit visitor change since our last application (palette,
      // switcher, ?skin=) wins: adopt it as the story's ground and stand
      // down until the segment next changes.
      const live = currentSkinAttr()
      if (appliedRef.current !== null && live !== appliedRef.current) {
        baseSkinRef.current = live
        setBaseSkin(live)
        appliedRef.current = live
      }

      const tops = boundaries.map((b) => b.el.getBoundingClientRect().top)
      const segment = activeSegment(tops, referenceLine())

      // The approach signal fires in BOTH modes (boundaries warm era fonts on
      // it); the crossing-chunk prefetch stays motion-only (network-proof e2e).
      const near = tops.some((top) => top <= window.innerHeight * PREFETCH_VIEWPORTS)
      if (near) setApproached(true)
      if (prefetchRef.current === 'idle' && near && !reducedRef.current) {
        prefetchRef.current = 'started'
        void import('./motion')
          .then((mod) => {
            motionModRef.current = mod
          })
          .catch(() => {
            // The story is never lost to a chunk error: crossings fall back
            // to instant swaps.
            prefetchRef.current = 'failed'
          })
      }

      if (segment === segmentRef.current) return
      const goingDown = segment > segmentRef.current
      segmentRef.current = segment

      const boundary = segment === -1 ? null : boundaries[segment]
      const target = boundary?.skin ?? baseSkinRef.current
      if (target === live) {
        // Visual no-op (deep link already era-skinned, or the base segment in
        // the visitor's own skin): nothing to choreograph, nothing to announce.
        appliedRef.current = target
        return
      }

      const message = goingDown && boundary ? boundary.announce : `Theme: ${labelOf(target)}`

      // A crossing arriving mid-flight cuts the previous band dead (destroy
      // never fires onSwap) and resolves the newest target.
      destroyHandle()

      const mod = motionModRef.current
      const band =
        goingDown && boundary ? boundary.el.querySelector<HTMLElement>('[data-retheme-band]') : null
      if (reducedRef.current || !goingDown || mod === null || band === null) {
        // Instant path: reduced motion, upward scrubs, or the chunk lost the
        // race to a fast scroll — the moment is never blocked on network.
        applyInstant(target, message)
        return
      }

      handleRef.current = mod.playRethemeCrossing(band, {
        onSwap: () => applyInstant(target, message),
        settleRoot: boundary?.el.nextElementSibling ?? null,
      })
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        process()
      })
    }

    process()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    // The ladder must survive geometry changes that arrive WITHOUT a scroll:
    // lazy islands and the assembly pin grow the page after load, which can
    // move a boundary across the reference line under a stationary viewport
    // (anchor jumps land, then content above mounts). Re-evaluate whenever
    // the document's size changes so the skin always matches the position.
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onScroll)
      ro.observe(document.documentElement)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro?.disconnect()
      destroyHandle()

      // Exit bookkeeping — EraRetheme's rules, ladder-shaped. Read the LIVE
      // attribute: context values are stale inside unmount cleanups.
      if (appliedRef.current === null) return
      if (document.documentElement.dataset.skin !== appliedRef.current) return
      const storedNow = readStoredSkin()
      const storedChangedDuringStory = storedNow !== storedAtMountRef.current
      const target =
        storedChangedDuringStory && isSkinName(storedNow) ? storedNow : baseSkinRef.current
      setSkinRef.current(target, { persist: false })
    }
  }, [])

  // A live flip to reduced motion mid-crossing must still complete the
  // re-theme: cut the band and apply the current segment's skin instantly.
  useEffect(() => {
    if (!reduced) return
    handleRef.current?.destroy()
    handleRef.current = null
    const boundaries = boundariesRef.current
    const segment = segmentRef.current
    const target =
      segment === -1 ? baseSkinRef.current : (boundaries[segment]?.skin ?? baseSkinRef.current)
    if (target !== undefined && target !== currentSkinAttr()) {
      setSkinRef.current(target, { persist: false })
      appliedRef.current = target
      setAnnounced(`Theme: ${labelOf(target)}`)
    }
  }, [reduced])

  return (
    <ScrollRethemeContext.Provider value={{ register, baseSkin, approached }}>
      {children}
      <div role="status" className={styles['sr-announce']}>
        {announced}
      </div>
    </ScrollRethemeContext.Provider>
  )
}
