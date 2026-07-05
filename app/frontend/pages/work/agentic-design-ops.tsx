import { Head, Link } from '@inertiajs/react'
import styles from './stub.module.css'

export default function AgenticDesignOps() {
  return (
    <>
      <Head title="Agentic design-ops — J Galenti" />
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Agentic design-ops</h1>
          <p className={styles.body}>This study lands with milestone M8.</p>
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
