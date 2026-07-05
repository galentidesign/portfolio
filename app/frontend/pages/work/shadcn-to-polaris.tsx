import { Head, Link } from '@inertiajs/react'
import styles from './stub.module.css'

export default function ShadcnToPolaris() {
  return (
    <>
      <Head title="shadcn → Polaris — J Galenti" />
      <main id="main" className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.heading}>shadcn → Polaris</h1>
          <p className={styles.body}>This study lands with milestone M8.</p>
          <Link href="/work" className={styles.link}>
            Back to the work →
          </Link>
        </div>
      </main>
    </>
  )
}
