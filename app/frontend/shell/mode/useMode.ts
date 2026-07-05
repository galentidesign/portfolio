import { useEffect } from 'react'

export type Mode = 'story' | 'skim'
export const MODE_STORAGE_KEY = 'portfolio:mode'

/**
 * Route → mode. '/' and '/story/*' → 'story'; '/work' and '/work/*' → 'skim';
 * else null. Neutral routes (system, resume, colophon, 404) return null so
 * they never clobber the stored mode. Exact-segment matching — an unmatched
 * path like /workshop is a 404, not a skim visit.
 */
export function modeForPath(path: string): Mode | null {
  if (path === '/' || path === '/story' || path.startsWith('/story/')) return 'story'
  if (path === '/work' || path.startsWith('/work/')) return 'skim'
  return null
}

/** localStorage read, try/catch-guarded. */
export function getStoredMode(): Mode | null {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY)
    if (stored === 'story' || stored === 'skim') return stored
  } catch {
    // private mode or storage quota exceeded
  }
  return null
}

/**
 * Call from SiteShell with the current path on every navigation.
 * Writes the derived mode to storage when non-null; neutral routes never
 * clobber the memory.
 */
export function useModeMemory(path: string): void {
  useEffect(() => {
    const mode = modeForPath(path)
    if (mode === null) return
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      // private mode or storage quota exceeded
    }
  }, [path])
}
