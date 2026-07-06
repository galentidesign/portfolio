import { Link } from '@inertiajs/react'
import { CONTACT_EMAIL, LINKEDIN_URL, SOURCE_URL } from '@/shell/contact'
import styles from './siteFooter.module.css'

/**
 * Site-wide contact footer (§6.8): email, LinkedIn, source, colophon on every
 * page. A top-level <footer> is a contentinfo landmark, which keeps its
 * content inside a landmark for axe's region rule without extra labeling.
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.name}>J Galenti</p>
      <ul className={styles.links}>
        <li>
          <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </li>
        <li>
          <a className={styles.link} href={LINKEDIN_URL} rel="noreferrer" target="_blank">
            LinkedIn
          </a>
        </li>
        <li>
          <a className={styles.link} href={SOURCE_URL} rel="noreferrer" target="_blank">
            Source
          </a>
        </li>
        <li>
          <Link className={styles.link} href="/colophon">
            Colophon
          </Link>
        </li>
      </ul>
    </footer>
  )
}
