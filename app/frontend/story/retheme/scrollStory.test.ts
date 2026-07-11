import { describe, expect, it } from 'vitest'
import { activeSegment, resolveSegment, veilBoundary, veilProgress } from './scrollStory'

describe('activeSegment', () => {
  it('returns -1 with no boundaries', () => {
    expect(activeSegment([], 384)).toBe(-1)
  })

  it('returns -1 while every boundary sits below the reference line', () => {
    expect(activeSegment([600, 1400, 2200], 384)).toBe(-1)
  })

  it('returns the last crossed boundary', () => {
    expect(activeSegment([200, 1400, 2200], 384)).toBe(0)
    expect(activeSegment([-400, 300, 2200], 384)).toBe(1)
  })

  it('returns the final segment when everything is crossed', () => {
    expect(activeSegment([-2000, -1200, -400], 384)).toBe(2)
  })

  it('treats a boundary exactly on the reference line as crossed', () => {
    expect(activeSegment([384, 1400], 384)).toBe(0)
  })
})

describe('resolveSegment', () => {
  // Reference line 384, CROSSING_MARGIN 48.

  it('matches plain activeSegment with no guard', () => {
    expect(resolveSegment([384, 1400], 384, -1, null)).toBe(0)
    expect(resolveSegment([-600, 200, 1000], 384, -1, null)).toBe(1)
    expect(resolveSegment([600, 700, 1000], 384, 2, null)).toBe(-1)
  })

  it('holds a crossed boundary that its own re-token pushed back below the line', () => {
    // The swap landed the marker at 505 (a +121px shift): plain-line reads
    // "uncrossed", but retreat needs top > max(505, 384) + 48 = 553.
    const guard = { boundary: 0, top: 505 }
    expect(resolveSegment([505, 1400], 384, 0, guard)).toBe(0)
    expect(resolveSegment([550, 1400], 384, 0, guard)).toBe(0)
    expect(resolveSegment([554, 1400], 384, 0, guard)).toBe(-1)
  })

  it('requires margin past the reference line when the swap landed the marker above it', () => {
    // Landed at 250 (a −134px shift): retreat line = max(250, 384) + 48.
    const guard = { boundary: 0, top: 250 }
    expect(resolveSegment([420, 1400], 384, 0, guard)).toBe(0)
    expect(resolveSegment([433, 1400], 384, 0, guard)).toBe(-1)
  })

  it('holds an un-crossed boundary that its own re-token pulled back above the line', () => {
    // A retreat landed the marker at 263 (a −121px shift): plain-line reads
    // "crossed", but re-advance needs top ≤ min(263, 384) − 48 = 215.
    const guard = { boundary: 1, top: 263 }
    expect(resolveSegment([-600, 263, 1400], 384, 0, guard)).toBe(0)
    expect(resolveSegment([-600, 216, 1400], 384, 0, guard)).toBe(0)
    expect(resolveSegment([-600, 214, 1400], 384, 0, guard)).toBe(1)
  })

  it('leaves unguarded boundaries on plain-line semantics', () => {
    const guard = { boundary: 0, top: 505 }
    // Boundary 1 still crosses at the reference line while 0 is guarded.
    expect(resolveSegment([505, 300, 1400], 384, 0, guard)).toBe(1)
  })

  it('is inert with no boundaries', () => {
    expect(resolveSegment([], 384, -1, null)).toBe(-1)
  })
})

describe('veilProgress', () => {
  it('is 0 as the marker enters at the bottom edge', () => {
    expect(veilProgress(768, 768)).toBe(0)
  })

  it('is 0.5 exactly on the reference line — the frame activeSegment flips on', () => {
    expect(veilProgress(384, 768)).toBe(0.5)
  })

  it('is 1 as the marker exits the top edge', () => {
    expect(veilProgress(0, 768)).toBe(1)
  })

  it('is linear across the zone', () => {
    expect(veilProgress(576, 768)).toBe(0.25)
    expect(veilProgress(192, 768)).toBe(0.75)
  })

  it('clamps outside the zone', () => {
    expect(veilProgress(2000, 768)).toBe(0)
    expect(veilProgress(-500, 768)).toBe(1)
  })
})

describe('veilBoundary', () => {
  it('returns -1 with no boundary inside the zone', () => {
    expect(veilBoundary([], 768)).toBe(-1)
    expect(veilBoundary([-40, 900], 768)).toBe(-1)
  })

  it('excludes the zone edges — a marker exactly at an edge is at rest', () => {
    expect(veilBoundary([0, 768], 768)).toBe(-1)
  })

  it('returns the single boundary inside the zone', () => {
    expect(veilBoundary([-900, 300, 1400], 768)).toBe(1)
  })

  it('nearest to the reference line wins when the zone holds two', () => {
    expect(veilBoundary([700, 400], 768)).toBe(1)
    expect(veilBoundary([390, 700], 768)).toBe(0)
  })

  it('ties resolve to the earlier boundary in document order', () => {
    expect(veilBoundary([334, 434], 768)).toBe(0)
  })
})
