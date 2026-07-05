import { Head, Link } from '@inertiajs/react'
import styles from './styles.module.css'

export default function Resume() {
  return (
    <>
      <Head title="Résumé — J Galenti" />
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Résumé</h1>
          <p className={styles.body}>
            The résumé page lands with milestone M9 — web summary plus a designed PDF.
          </p>
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
