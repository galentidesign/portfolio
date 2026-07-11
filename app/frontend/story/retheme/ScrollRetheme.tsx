import { useEffect, useRef } from 'react'
import { skins, type SkinName } from '@/ds/tokens/generated/skins'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import { RethemeBand, type RethemeTreatment } from './RethemeBand'
import { useScrollRethemeStory } from './ScrollRethemeStory'

export interface ScrollRethemeProps {
  /**
   * The era skin this boundary applies when the story scrolls across it.
   * Omit for the sweep-home boundary — the story returns to its base skin
   * (the visitor's own ground).
   */
  skin?: SkinName
  /** Band dressing for the crossing; omitted renders the plain sweep band. */
  treatment?: RethemeTreatment
  /** Screen-reader announcement for the downward crossing. Defaults to "Theme: <label>". */
  announce?: string
  /** Font families to warm on mount so era type is resident before the crossing. */
  warmFonts?: readonly string[]
  /**
   * HUD caption the band types out mid-travel (decorative, aria-hidden).
   * A string is one line; an array streams as stacked mono lines.
   * Defaults to "loading <label>…".
   */
  caption?: string | readonly string[]
}

/**
 * A scroll-story boundary marker — zero-height in flow, placed between two
 * beats inside a <ScrollRethemeStory>. Crossing it downward rethemes the
 * page to `skin` through the era-crossing band; scrubbing back up returns
 * instantly. The beat section that follows this marker in the DOM is the
 * crossing's settle root (its [data-retheme-stagger] members ride the
 * cascade). Must not sit inside a transformed ancestor — the band is
 * position: fixed.
 */
export function ScrollRetheme({
  skin,
  treatment,
  announce,
  warmFonts,
  caption,
}: ScrollRethemeProps) {
  const { register, baseSkin, approached } = useScrollRethemeStory()
  const { reduced } = useMotionPref()
  const markerRef = useRef<HTMLDivElement | null>(null)
  // The band dressing (and the era fonts its interior's text pulls in) waits
  // for the coordinator's APPROACH signal: home is the LCP route, and a
  // boundary's crossing sits viewports below the fold — unlike a chapter's
  // EraRetheme, which crosses the moment it mounts. A session that never
  // scrolls near the story pays nothing; an early crossing that outruns the
  // dressing simply swaps instantly, band-less. Reduced motion never shows
  // a band at all.
  const dressed = approached && !reduced

  const bandSkin = skin ?? baseSkin
  const label = skins.find((s) => s.name === bandSkin)?.label ?? bandSkin
  const message = announce ?? `Theme: ${label}`
  const captionLines: readonly string[] =
    caption === undefined
      ? [`loading ${label.toLowerCase()}…`]
      : typeof caption === 'string'
        ? [caption]
        : caption

  useEffect(() => {
    const el = markerRef.current
    if (el === null) return
    return register({ el, skin, announce: message })
  }, [register, skin, message])

  // Warm the era type on approach (both modes — reduced-motion crossings
  // swap instantly and must not FOUT either): resident a viewport before
  // any crossing, invisible to the LCP window.
  useEffect(() => {
    if (!approached) return
    if (warmFonts === undefined || typeof document.fonts?.load !== 'function') return
    for (const family of warmFonts) {
      document.fonts.load(`1em '${family}'`).catch(() => {})
      document.fonts.load(`700 1em '${family}'`).catch(() => {})
    }
  }, [approached, warmFonts])

  return (
    <div ref={markerRef} data-testid="scroll-retheme" data-era-skin={bandSkin}>
      {dressed ? (
        <RethemeBand skin={bandSkin} treatment={treatment} captionLines={captionLines} />
      ) : null}
    </div>
  )
}
