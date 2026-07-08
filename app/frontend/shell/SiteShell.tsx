import { useState, useEffect, type ReactNode } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Nav } from '@/ds/components/Nav/Nav'
import { Toast } from '@/ds/components/Toast/Toast'
import { useSkin } from '@/shell/skin/SkinProvider'
import { SiteFooter } from '@/shell/SiteFooter'
import { buildSiteActions } from '@/shell/actions'
import { modeForPath, getStoredMode, useModeMemory } from '@/shell/mode/useMode'
import { initTelemetry, markSkimVia, track } from '@/telemetry/track'
import styles from './siteShell.module.css'

export function SiteShell({ children }: { children: ReactNode }) {
  const { url } = usePage()
  const currentPath = url.split('?')[0]

  const { skins, setSkin } = useSkin()
  const [notice, setNotice] = useState<string | null>(null)

  // Capture once at mount, before useModeMemory writes — this determines the
  // hatch label for the entire session without re-evaluating on navigation.
  const [storedModeAtMount] = useState(() => getStoredMode())

  useModeMemory(currentPath)

  // Boot telemetry once on mount. initTelemetry is idempotent so StrictMode
  // double-invoke is safe (second call returns immediately).
  useEffect(() => {
    initTelemetry()
  }, [])

  const actions = buildSiteActions({
    currentPath,
    skins,
    setSkin,
    visit: (href) => router.visit(href),
    notify: (message) => setNotice(message),
    track,
  })

  const navItems = [
    { label: 'Work', href: '/work', current: currentPath.startsWith('/work') },
    { label: 'Gallery', href: '/gallery', current: currentPath.startsWith('/gallery') },
    { label: 'System', href: '/system', current: currentPath.startsWith('/system') },
    { label: 'Résumé', href: '/resume', current: currentPath.startsWith('/resume') },
  ]

  const isStoryRoute = modeForPath(currentPath) === 'story'
  const hatchLabel = storedModeAtMount === 'skim' ? 'Continue to the work →' : 'Skip to the work →'

  return (
    <>
      <Nav
        brand={{ label: 'J Galenti', href: '/' }}
        items={navItems}
        label="Site"
        linkAs={Link}
        actions={actions}
        onPaletteOpenChange={(open) => {
          if (open) track('palette_open')
        }}
      />

      {/* Escape hatch: fixed pill, story routes only. Placed right after Nav so
          it appears early in tab order from the top of every story page. The
          labeled nav wrapper keeps the link inside a landmark (axe: region). */}
      {isStoryRoute && (
        <nav aria-label="Escape hatch" className={styles['hatch-nav']}>
          <Link
            href="/work"
            className={styles.hatch}
            data-testid="escape-hatch"
            onClick={() => {
              markSkimVia('hatch')
              track('mode_switch', { to: 'skim', via: 'hatch' })
            }}
          >
            {hatchLabel}
          </Link>
        </nav>
      )}

      {/* Notice host: single toast, dismissed by timer or user action. The
          aside keeps transient notices inside a landmark for axe's region
          rule on open-state scans. */}
      {notice !== null && (
        <aside aria-label="Notifications" data-testid="shell-toast">
          <Toast tone="positive" open={true} autoHideMs={4000} onDismiss={() => setNotice(null)}>
            {notice}
          </Toast>
        </aside>
      )}

      {children}

      <SiteFooter />
    </>
  )
}
