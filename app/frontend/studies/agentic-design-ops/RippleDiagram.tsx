import styles from './RippleDiagram.module.css'

/**
 * Ripple diagram: a single token source radiates changes to all downstream
 * targets simultaneously. Nodes are DOM (text is selectable).
 * SVG connectors are decorative (aria-hidden, role="presentation").
 * DOM order: Token source → Components → Docs → Design library.
 */
export function RippleDiagram() {
  return (
    <figure className={styles.figure} data-testid="ripple-diagram">
      <div className={styles.layout}>
        {/* Source node */}
        <div className={styles.level}>
          <div className={styles.node} data-role="source" data-testid="ripple-node-source">
            Token source
          </div>
        </div>

        {/* Fan-out: source → targets — decorative, aria-hidden */}
        <svg
          className={styles.connector}
          viewBox="0 0 240 32"
          aria-hidden="true"
          role="presentation"
          preserveAspectRatio="none"
        >
          <line x1="120" y1="0" x2="40" y2="32" />
          <line x1="120" y1="0" x2="120" y2="32" />
          <line x1="120" y1="0" x2="200" y2="32" />
        </svg>

        {/* Target nodes */}
        <div className={styles['level-targets']}>
          <div className={styles.node} data-role="target" data-testid="ripple-node-components">
            Components
          </div>
          <div className={styles.node} data-role="target" data-testid="ripple-node-docs">
            Docs
          </div>
          <div className={styles.node} data-role="target" data-testid="ripple-node-design-library">
            Design library
          </div>
        </div>
      </div>

      {/* Flow description — supplements DOM linearization for screen readers */}
      <figcaption className={styles.caption}>
        A token change at the source propagates simultaneously to all downstream targets.
      </figcaption>
    </figure>
  )
}
