import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'

export interface IslandMountProps {
  /** Space reserved before the island mounts, so boundaries don't jump. */
  placeholderHeight?: string
  children: ReactNode
}

/**
 * Below-fold island gate (the LCP guardrail): defers mounting a lazy beat
 * interior until the visitor scrolls within a viewport of it, holding its
 * reserved height so the scroll ladder's geometry stays stable. Where
 * IntersectionObserver is unavailable (jsdom) it mounts immediately — the
 * static story is never gated on an observer.
 */
export function IslandMount({ placeholderHeight = '24rem', children }: IslandMountProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (near) return
    const host = hostRef.current
    if (host === null) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(host)
    return () => io.disconnect()
  }, [near])

  return (
    <div ref={hostRef} style={near ? undefined : { minHeight: placeholderHeight }}>
      {near ? (
        <Suspense fallback={<div style={{ minHeight: placeholderHeight }} aria-hidden="true" />}>
          {children}
        </Suspense>
      ) : null}
    </div>
  )
}
