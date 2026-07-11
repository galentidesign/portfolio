import { Button } from '@/ds/components/Button/Button'
import { Badge } from '@/ds/components/Badge/Badge'
import { FormField } from '@/ds/components/FormField/FormField'
import styles from './islands.module.css'

/**
 * The 2018 flat-material component sheet — a storybook-page pastiche, inert.
 * Era-plausible fiction: the years when the component sheet WAS the product
 * page. Same DS components as everywhere; the react-era skin brings the
 * period look.
 */
export function ReactArtifact() {
  return (
    <div className={styles.sheet}>
      <div className={styles['sheet-bar']} aria-hidden="true" data-retheme-stagger="chrome">
        <span>components / Button / all-states</span>
        <span>storybook 4.1</span>
      </div>
      <div className={styles['sheet-split']}>
        {/* Story-tree rail — the Storybook-4 anatomy that named the sheet.
            Decorative fiction, same rules as the chrome bar. */}
        <div className={styles['sheet-nav']} aria-hidden="true" data-retheme-stagger="chrome">
          <span className={styles['sheet-nav-item']} data-active="true">
            Button
          </span>
          <span className={styles['sheet-nav-item']}>Badge</span>
          <span className={styles['sheet-nav-item']}>Form Field</span>
        </div>
        <div
          inert
          className={styles['sheet-body']}
          data-testid="react-artifact"
          data-retheme-stagger="surface"
        >
          <div className={styles['sheet-row']}>
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className={styles['sheet-row']}>
            <Badge tone="positive">Passing</Badge>
            <Badge tone="caution">In review</Badge>
            <Badge tone="neutral">Draft</Badge>
          </div>
          <div className={styles['sheet-row']}>
            <FormField label="Prop: label" placeholder="Type to filter stories…" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReactArtifact
