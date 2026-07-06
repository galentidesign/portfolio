import { useState, useEffect } from 'react'
import { AppProvider, Banner } from '@shopify/polaris'
import en from '@shopify/polaris/locales/en.json'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import { usePolarisStyles } from './usePolarisStyles'
import { useDemoChores } from './useDemoChores'
import { IndexView } from './views/IndexView'
import { ChoreForm, EditViewLoader } from './views/ChoreForm'
import type { DemoState, DemoView } from './types'
import styles from './PolarisDemo.module.css'

function getViewFromSearch(search: string): DemoView {
  const params = new URLSearchParams(search)
  const v = params.get('view')
  if (v === 'create' || v === 'edit' || v === 'index') return v
  return 'index'
}

function getChoreIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(search)
  const c = params.get('chore')
  if (c === null) return null
  const n = parseInt(c, 10)
  return isNaN(n) ? null : n
}

function pushView(view: DemoView, choreId?: number) {
  const url = new URL(window.location.href)
  url.searchParams.set('view', view)
  if (choreId !== undefined) {
    url.searchParams.set('chore', String(choreId))
  } else {
    url.searchParams.delete('chore')
  }
  history.pushState(null, '', url.toString())
}

interface PolarisDemoProps {
  demoState: DemoState
}

/**
 * PolarisDemo — the lazy entry chunk for Study B.
 *
 * Imported only via dynamic import from the page component; never statically
 * imported anywhere else. Emitted chunk name: PolarisDemo-*.js.
 */
export default function PolarisDemo({ demoState }: PolarisDemoProps) {
  usePolarisStyles()

  const { reduced } = useMotionPref()

  // The fetch loop lives here (not in IndexView) so the state switcher keeps
  // driving the data layer in every view, and create/edit consume the same
  // fetched households the index renders — no fixture duplication.
  const { status, chores, households, retry } = useDemoChores(demoState)

  const [view, setView] = useState<DemoView>(() => getViewFromSearch(window.location.search))
  const [editChoreId, setEditChoreId] = useState<number | null>(() =>
    getChoreIdFromSearch(window.location.search),
  )
  const [confirmation, setConfirmation] = useState<string | null>(null)

  // Back-button support: sync view state from URL on popstate.
  useEffect(() => {
    const onPop = () => {
      setView(getViewFromSearch(window.location.search))
      setEditChoreId(getChoreIdFromSearch(window.location.search))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigateTo = (v: DemoView, choreId?: number) => {
    pushView(v, choreId)
    setView(v)
    setEditChoreId(choreId ?? null)
  }

  const handleSubmitSuccess = () => {
    navigateTo('index')
    setConfirmation('Demo only — nothing is persisted')
  }

  const rootClass = [styles.root, reduced ? styles['motion-reduced'] : ''].filter(Boolean).join(' ')

  return (
    <div className={rootClass} data-polaris-demo-root data-state={demoState} data-view={view}>
      <AppProvider i18n={en}>
        {/* Banner, not Toast: Toast requires Polaris Frame, and Frame renders
            a nested <main> landmark that cannot pass the zero-axe bar inside
            a page that already has one. A dismissible Banner is the same
            confirmation pattern without the landmark cost. */}
        {confirmation !== null && (
          <div className={styles.confirmation}>
            <Banner tone="success" onDismiss={() => setConfirmation(null)}>
              <p>{confirmation}</p>
            </Banner>
          </div>
        )}

        {view === 'index' && (
          <IndexView
            status={status}
            chores={chores}
            retry={retry}
            onCreateNew={() => navigateTo('create')}
            onEdit={(id) => navigateTo('edit', id)}
          />
        )}

        {view === 'create' && (
          <ChoreForm
            mode="create"
            households={households}
            onBack={() => navigateTo('index')}
            onSubmit={handleSubmitSuccess}
          />
        )}

        {view === 'edit' && editChoreId !== null && (
          <EditViewLoader
            choreId={editChoreId}
            households={households}
            onBack={() => navigateTo('index')}
            onSubmit={handleSubmitSuccess}
            onDelete={handleSubmitSuccess}
          />
        )}

        {/* Fallback: edit with no chore id goes back to index */}
        {view === 'edit' && editChoreId === null && (
          <IndexView
            status={status}
            chores={chores}
            retry={retry}
            onCreateNew={() => navigateTo('create')}
            onEdit={(id) => navigateTo('edit', id)}
          />
        )}
      </AppProvider>
    </div>
  )
}
