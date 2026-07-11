import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { whenIdle } from '@/ds/motion/capabilities'

export interface IslandMountProps {
  /** Space reserved before the island mounts, so boundaries don't jump. */
  placeholderHeight?: string
  children: ReactNode
}

/**
 * Below-fold island gate (the LCP guardrail): defers mounting a lazy beat
 * interior until after load + an idle slot (the M10 deferral pattern), so
 * island chunks never race the LCP paint. Idle — not viewport approach — on
 * purpose: the page's geometry goes FINAL moments after load, which keeps
 * anchor jumps (the hatch) and the scroll ladder's boundary math stable; an
 * approach-mounted island growing above the viewport would strand the
 * reader mid-story. Reserved height holds the slot until then.
 */
export function IslandMount({ placeholderHeight = '24rem', children }: IslandMountProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => whenIdle(() => setReady(true)), [])

  if (!ready) return <div style={{ minHeight: placeholderHeight }} />
  return <Suspense fallback={<div style={{ minHeight: placeholderHeight }} />}>{children}</Suspense>
}
