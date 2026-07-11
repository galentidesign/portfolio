import type { SkinName } from '@/ds/tokens/generated/skins'

/**
 * Pure geometry for the scroll-retheme ladder (ScrollRethemeStory).
 *
 * The home story is a ladder of boundaries; the viewport's reference line
 * (its vertical centre) decides which segment is active. Segment -1 is the
 * base — the visitor's own skin; segment i means boundary i has been crossed
 * and its era skin governs until the next boundary.
 */

export interface ScrollBoundary {
  /** In-flow marker element whose top edge is the crossing line. */
  el: HTMLElement
  /** Era skin applied going down; undefined = sweep home to the base skin. */
  skin: SkinName | undefined
  /** Screen-reader announcement for the downward crossing. */
  announce: string
}

/**
 * Index of the last boundary whose top sits at or above the reference line,
 * or -1 when none has been crossed. `tops` must be in document order
 * (viewport-relative, as read from getBoundingClientRect).
 */
export function activeSegment(tops: readonly number[], referenceLine: number): number {
  let active = -1
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= referenceLine) active = i
  }
  return active
}

/**
 * Clearance (px) a marker must put between itself and its post-swap position
 * before it can cross back. A re-token shifts the layout — era type ramps
 * have different metrics, ±135px of marker drift measured on the home story —
 * which moves the very markers the ladder reads: without a guard a swap can
 * push its own boundary back across the reference line and the skin thrashes
 * at frame rate (observed as 28 flips across one journey).
 */
export const CROSSING_MARGIN = 48

export interface CrossingGuard {
  /** The boundary nearest the reference line in the last swap. */
  boundary: number
  /**
   * The marker's viewport top where the swap's re-token landed it, frozen at
   * the swap frame. Scrolling moves the live marker away from this value, so
   * re-crossing costs real scroll distance; the swap's own layout shift —
   * by definition AT this value — never can.
   */
  top: number
}

/**
 * Segment resolution with a post-swap crossing guard. Every boundary crosses
 * at the reference line — the veil covers that frame — EXCEPT the one the
 * last swap moved: it must clear its own landed position by CROSSING_MARGIN
 * before it can cross back, in either direction. The guard adapts to each
 * boundary's real re-token shift; away from the last swap the ladder keeps
 * plain-line semantics (including the stationary ResizeObserver backstop).
 */
export function resolveSegment(
  tops: readonly number[],
  referenceLine: number,
  current: number,
  guard: CrossingGuard | null,
  margin: number = CROSSING_MARGIN,
): number {
  const lineFor = (i: number): number => {
    if (guard === null || guard.boundary !== i) return referenceLine
    if (i <= current) {
      // Currently crossed: retreat only after falling past the landed spot.
      return Math.max(guard.top, referenceLine) + margin
    }
    // Currently uncrossed: re-advance only after rising past the landed spot.
    return Math.min(guard.top, referenceLine) - margin
  }
  let active = -1
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= lineFor(i)) active = i
  }
  return active
}

/**
 * Veil progress for one boundary: the crossing's travel zone is the viewport
 * itself. p = 0 as the marker's top enters at the bottom edge, p = 0.5 when
 * it sits exactly on the reference line — the same predicate activeSegment
 * flips on, so the veil geometrically covers the swap frame — and p = 1 as
 * it exits the top edge. Linear on purpose: an eased mapping would move the
 * cover moment off the swap frame.
 */
export function veilProgress(top: number, viewportHeight: number): number {
  return Math.min(Math.max(1 - top / viewportHeight, 0), 1)
}

/**
 * Index of the boundary the veil should dress: the one nearest the reference
 * line among those inside the travel zone (strictly between the viewport
 * edges), or -1 when none is. Nearest-wins keeps a single veil live when a
 * tall viewport holds two boundaries at once; ties resolve to the earlier
 * boundary in document order.
 */
export function veilBoundary(tops: readonly number[], viewportHeight: number): number {
  const referenceLine = viewportHeight / 2
  let nearest = -1
  let nearestDistance = Infinity
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= 0 || tops[i] >= viewportHeight) continue
    const distance = Math.abs(tops[i] - referenceLine)
    if (distance < nearestDistance) {
      nearest = i
      nearestDistance = distance
    }
  }
  return nearest
}
