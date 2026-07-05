import { Head } from '@inertiajs/react'
import { Button } from '@/ds/components/Button/Button'
import { EmptyState } from '@/ds/components/EmptyState/EmptyState'
import styles from './styles.module.css'

export default function NotFound() {
  return (
    <>
      <Head title="Not found — J Galenti" />
      <main id="main" className={styles.page}>
        <EmptyState
          icon={<span className={styles.code}>404</span>}
          title="Nothing is assembled at this address"
          titleAs="h1"
          description="The path you followed doesn't exist — the site is agent-built in public, so it may simply not be built yet."
          action={
            <div className={styles.actions}>
              <Button href="/">Start the story</Button>
              <Button variant="secondary" href="/work">
                Skip to the work
              </Button>
            </div>
          }
        />
      </main>
    </>
  )
}
