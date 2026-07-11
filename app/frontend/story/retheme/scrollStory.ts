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
