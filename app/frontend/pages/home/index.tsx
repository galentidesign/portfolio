import { Head, Link } from '@inertiajs/react'
import styles from './styles.module.css'

export default function Home() {
  return (
    <>
      <Head title="J Galenti" />
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.annotation}>under construction — agent-built in public</p>
          <h1 className={styles.heading}>J Galenti</h1>
          <p className={styles.body}>
            Design technologist. The token engine just landed — every color, radius, and easing on
            this page compiles from one JSON file per skin.
          </p>
          <Link href="/system/tokens" className={styles.link}>
            Inspect the token system →
          </Link>
        </div>
      </main>
    </>
  )
}
