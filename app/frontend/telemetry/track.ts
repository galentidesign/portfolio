// First-party beacon (§7 + README contract in this directory). Fire-and-
// forget: never blocks, never retries, never surfaces failure to the UI.
// No cookies, no localStorage — the only correlation is an in-memory UUID
// that dies with the pageload.

import { router } from '@inertiajs/react'

export type EventKind =
  | 'page_view'
  | 'scroll_depth'
  | 'mode_switch'
  | 'skin_switch'
  | 'palette_open'
  | 'palette_action'
  | 'demo_state'
  | 'resume_download'
  | 'story_complete'
  | 'skim_entry'

const pageloadId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : 'no-uuid'

// ── Module-level state (per-pageload; no cookies, no storage) ─────────────────

let initialized = false

// Per-path fired quartiles: Map<pathname, Set<quartile>>
const firedQuartiles = new Map<string, Set<number>>()

// skim_entry: once per pageload (path must be exactly '/work')
let skimEntryFired = false
let pendingSkimVia: 'direct' | 'hatch' | 'palette' = 'direct'

// Cleanup handles for _resetForTest
let scrollHandler: (() => void) | null = null
let routerUnsubscribe: (() => void) | null = null

// ── Core track() ─────────────────────────────────────────────────────────────

export function track(kind: EventKind, payload: Record<string, unknown> = {}): void {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return

  const body = JSON.stringify({
    kind,
    payload: { ...payload, pageload_id: pageloadId, path: window.location.pathname },
  })
  try {
    navigator.sendBeacon('/t', new Blob([body], { type: 'application/json' }))
  } catch {
    // Fire-and-forget by contract: a failed beacon must never affect the UI.
  }
}

// ── markSkimVia ───────────────────────────────────────────────────────────────

/**
 * Stash the via for the next skim_entry. Falls back to 'direct' if not called
 * before the first /work navigation.
 */
export function markSkimVia(via: 'hatch' | 'palette'): void {
  pendingSkimVia = via
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function fireSkimEntry(path: string): void {
  if (skimEntryFired || path !== '/work') return
  skimEntryFired = true
  const via = pendingSkimVia
  pendingSkimVia = 'direct'
  track('skim_entry', { via })
}

function installScrollListener(): void {
  let ticking = false
  const handler = (): void => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0) return // short page — guard division by zero
      const fraction = window.scrollY / scrollable
      const path = window.location.pathname
      let pathSet = firedQuartiles.get(path)
      if (!pathSet) {
        pathSet = new Set()
        firedQuartiles.set(path, pathSet)
      }
      for (const q of [25, 50, 75, 100] as const) {
        if (fraction * 100 >= q && !pathSet.has(q)) {
          pathSet.add(q)
          track('scroll_depth', { quartile: q })
        }
      }
    })
  }
  scrollHandler = handler
  window.addEventListener('scroll', handler, { passive: true })
}

// ── initTelemetry ─────────────────────────────────────────────────────────────

/**
 * Idempotent — call once from SiteShell mount. Sets up:
 *  a. Initial page_view (with referrer + UTM params when present)
 *  b. Inertia navigate → page_view per client-side navigation
 *  c. rAF-throttled scroll listener → scroll_depth quartile events (once per
 *     path/quartile per pageload)
 *  d. skim_entry on first /work arrival per pageload
 */
export function initTelemetry(): void {
  if (typeof window === 'undefined') return
  if (initialized) return
  initialized = true

  // a. Initial page_view
  const searchParams = new URLSearchParams(window.location.search)
  const pageViewPayload: Record<string, unknown> = {}
  if (document.referrer) pageViewPayload.referrer = document.referrer
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')
  if (utmSource) pageViewPayload.utm_source = utmSource
  if (utmMedium) pageViewPayload.utm_medium = utmMedium
  if (utmCampaign) pageViewPayload.utm_campaign = utmCampaign
  track('page_view', pageViewPayload)

  // skim_entry on initial load
  fireSkimEntry(window.location.pathname)

  // b. Inertia client-side navigation listener
  routerUnsubscribe = router.on('navigate', () => {
    track('page_view')
    fireSkimEntry(window.location.pathname)
  })

  // c. Scroll depth quartile listener
  installScrollListener()
}

// ── Test reset (do not call in production code) ───────────────────────────────

/** @internal Reset all module-level state between unit tests. */
export function _resetForTest(): void {
  initialized = false
  firedQuartiles.clear()
  skimEntryFired = false
  pendingSkimVia = 'direct'
  if (scrollHandler !== null && typeof window !== 'undefined') {
    window.removeEventListener('scroll', scrollHandler)
    scrollHandler = null
  }
  if (routerUnsubscribe !== null) {
    routerUnsubscribe()
    routerUnsubscribe = null
  }
}
