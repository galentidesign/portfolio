import { describe, expect, it } from 'vitest'
import { activeSegment } from './scrollStory'

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
