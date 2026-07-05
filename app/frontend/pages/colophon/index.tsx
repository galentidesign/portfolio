import { Head, Link } from '@inertiajs/react'
import styles from './styles.module.css'

export default function Colophon() {
  return (
    <>
      <Head title="Colophon — J Galenti" />
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>Colophon</h1>
          <p className={styles.body}>
            The colophon lands with milestone M9 — stack, craft-bar numbers, and the privacy note.
          </p>
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
