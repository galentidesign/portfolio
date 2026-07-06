import styles from './OrchestrationDiagram.module.css'

/**
 * Architecture flow: Orchestrator fans out to parallel agents through a
 * review gate to produce artifacts. Nodes are DOM (text is selectable).
 * SVG connectors are decorative (aria-hidden, role="presentation").
 * DOM order linearizes the flow: Orchestrator → Agent A/B/C → Review gate → Artifact.
 */
export function OrchestrationDiagram() {
  return (
    <figure className={styles.figure} data-testid="orchestration-diagram">
      <div className={styles.layout}>
        {/* Level 1: Orchestrator */}
        <div className={styles.level}>
          <div
            className={styles.node}
            data-role="orchestrator"
            data-testid="orch-node-orchestrator"
          >
            Orchestrator
          </div>
        </div>

        {/* Fan-out: 1 → 3 — decorative, aria-hidden */}
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

        {/* Level 2: Parallel agents */}
        <div className={styles['level-agents']}>
          <div className={styles.node} data-role="agent" data-testid="orch-node-agent-a">
            Agent A
          </div>
          <div className={styles.node} data-role="agent" data-testid="orch-node-agent-b">
            Agent B
          </div>
          <div className={styles.node} data-role="agent" data-testid="orch-node-agent-c">
            Agent C
          </div>
        </div>

        {/* Fan-in: 3 → 1 — decorative, aria-hidden */}
        <svg
          className={styles.connector}
          viewBox="0 0 240 32"
          aria-hidden="true"
          role="presentation"
          preserveAspectRatio="none"
        >
          <line x1="40" y1="0" x2="120" y2="32" />
          <line x1="120" y1="0" x2="120" y2="32" />
          <line x1="200" y1="0" x2="120" y2="32" />
        </svg>

        {/* Level 3: Review gate */}
        <div className={styles.level}>
          <div className={styles.node} data-role="gate" data-testid="orch-node-gate">
            Review gate
          </div>
        </div>

        {/* Straight: gate → artifact — decorative, aria-hidden */}
        <svg
          className={styles['connector-sm']}
          viewBox="0 0 240 16"
          aria-hidden="true"
          role="presentation"
        >
          <line x1="120" y1="0" x2="120" y2="16" />
        </svg>

        {/* Level 4: Artifact */}
        <div className={styles.level}>
          <div className={styles.node} data-role="artifact" data-testid="orch-node-artifact">
            Artifact
          </div>
        </div>
      </div>

      {/* Flow description — supplements DOM linearization for screen readers */}
      <figcaption className={styles.caption}>
        Orchestrator fans work to parallel agents; outputs merge through a review gate to produce
        the artifact.
      </figcaption>
    </figure>
  )
}
