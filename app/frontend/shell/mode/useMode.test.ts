import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { modeForPath, getStoredMode, useModeMemory, MODE_STORAGE_KEY } from './useMode'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

// ── modeForPath ───────────────────────────────────────────────────────────────

describe('modeForPath', () => {
  it('returns "story" for "/"', () => {
    expect(modeForPath('/')).toBe('story')
  })

  it('returns "story" for "/story"', () => {
    expect(modeForPath('/story')).toBe('story')
  })

  it('returns "story" for "/story/rails-era"', () => {
    expect(modeForPath('/story/rails-era')).toBe('story')
  })

  it('returns "story" for "/story/react-era"', () => {
    expect(modeForPath('/story/react-era')).toBe('story')
  })

  it('returns "story" for "/story/agentic"', () => {
    expect(modeForPath('/story/agentic')).toBe('story')
  })

  it('returns "skim" for "/work"', () => {
    expect(modeForPath('/work')).toBe('skim')
  })

  it('returns "skim" for "/work/agentic-design-ops"', () => {
    expect(modeForPath('/work/agentic-design-ops')).toBe('skim')
  })

  it('returns null for "/system"', () => {
    expect(modeForPath('/system')).toBeNull()
  })

  it('returns null for "/system/components/button"', () => {
    expect(modeForPath('/system/components/button')).toBeNull()
  })

  it('returns null for "/resume"', () => {
    expect(modeForPath('/resume')).toBeNull()
  })

  it('returns null for "/colophon"', () => {
    expect(modeForPath('/colophon')).toBeNull()
  })
})

// ── getStoredMode ─────────────────────────────────────────────────────────────

describe('getStoredMode', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredMode()).toBeNull()
  })

  it('returns "story" when "story" is stored', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'story')
    expect(getStoredMode()).toBe('story')
  })

  it('returns "skim" when "skim" is stored', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'skim')
    expect(getStoredMode()).toBe('skim')
  })

  it('returns null for an invalid stored value', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'invalid')
    expect(getStoredMode()).toBeNull()
  })
})

// ── useModeMemory ─────────────────────────────────────────────────────────────

describe('useModeMemory', () => {
  it('writes "story" for "/"', () => {
    renderHook(() => useModeMemory('/'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('story')
  })

  it('writes "story" for "/story/rails-era"', () => {
    renderHook(() => useModeMemory('/story/rails-era'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('story')
  })

  it('writes "skim" for "/work"', () => {
    renderHook(() => useModeMemory('/work'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('skim')
  })

  it('does not clobber an existing "story" mode on a neutral route', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'story')
    renderHook(() => useModeMemory('/system'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('story')
  })

  it('does not clobber an existing "skim" mode on a neutral route', () => {
    localStorage.setItem(MODE_STORAGE_KEY, 'skim')
    renderHook(() => useModeMemory('/resume'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('skim')
  })

  it('writes nothing when on a neutral route and storage is empty', () => {
    renderHook(() => useModeMemory('/colophon'))
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBeNull()
  })

  it('updates storage when path changes from neutral to story', () => {
    const { rerender } = renderHook(({ path }: { path: string }) => useModeMemory(path), {
      initialProps: { path: '/system' },
    })
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBeNull()

    rerender({ path: '/' })
    expect(localStorage.getItem(MODE_STORAGE_KEY)).toBe('story')
  })
})
