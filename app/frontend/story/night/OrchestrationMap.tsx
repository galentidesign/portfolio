import { useEffect, useRef } from 'react'
import { useMotionPref } from '@/ds/motion/useMotionPref'
import type { NightMotionHandle } from './motion'
import styles from './night.module.css'

interface MapNode {
  role: 'orchestrator' | 'agent' | 'gate' | 'artifact'
  label: string
  x: number
  y: number
  width: number
  /** Two agent nodes ride the slow micro-orbit in motion mode. */
  orbit?: boolean
}

const NODE_HEIGHT = 28

const NODES: readonly MapNode[] = [
  { role: 'orchestrator', label: 'Orchestrator', x: 118, y: 8, width: 124 },
  { role: 'agent', label: 'Agent A', x: 22, y: 96, width: 88, orbit: true },
  { role: 'agent', label: 'Agent B', x: 136, y: 96, width: 88 },
  { role: 'agent', label: 'Agent C', x: 250, y: 96, width: 88, orbit: true },
  { role: 'gate', label: 'Review gate', x: 124, y: 164, width: 112 },
  { role: 'artifact', label: 'Artifact', x: 134, y: 212, width: 92 },
]

// Fan-out (1→3), fan-in (3→1), gate→artifact. Path order is draw order.
const EDGES: readonly string[] = [
  'M180 38 C180 62 66 68 66 96',
  'M180 38 C180 60 180 72 180 96',
  'M180 38 C180 62 294 68 294 96',
  'M66 124 C66 150 180 140 180 164',
  'M180 124 C180 138 180 150 180 164',
  'M294 124 C294 150 180 140 180 164',
  'M180 192 C180 199 180 205 180 212',
]

/**
 * Compact night-zone variant of the study's orchestration flow (the full
 * diagram lives on /work/agentic-design-ops): one orchestrator fanning out
 * to parallel agents, merging through a review gate into the artifact.
 *
 * The SVG is decorative (aria-hidden) — the figcaption carries the flow, so
 * content parity between motion modes is structural. Motion (dynamic import,
 * THE MOTION GATE): on scroll-enter, edges draw themselves (DrawSVG), nodes
 * pulse in staggered, and two agent nodes ride a slow, finite micro-orbit.
 * Reduced motion renders the same map fully drawn, statically.
 */
export function OrchestrationMap() {
  const { reduced } = useMotionPref()
  const figureRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const figure = figureRef.current
    if (reduced || figure === null) return

    let cancelled = false
    let handle: NightMotionHandle | null = null
    void import('./motion')
      .then(({ mountOrchestrationMotion }) => {
        if (cancelled || figureRef.current === null) return
        handle = mountOrchestrationMotion(figureRef.current)
      })
      .catch(() => {
        // Decorative enhancement only — a chunk error leaves the base render.
      })

    return () => {
      cancelled = true
      handle?.destroy()
      handle = null
    }
  }, [reduced])

  return (
    <figure ref={figureRef} className={styles.map} data-testid="orchestration-map">
      <svg
        className={styles['map-svg']}
        viewBox="0 0 360 248"
        aria-hidden="true"
        role="presentation"
        focusable="false"
      >
        {EDGES.map((d) => (
          <path key={d} className={styles['map-edge']} data-orch-edge d={d} />
        ))}
        {NODES.map((node) => (
          <g
            key={node.label}
            className={styles['map-node']}
            data-role={node.role}
            data-orch-node
            {...(node.orbit ? { 'data-orch-orbit': '' } : {})}
          >
            <rect x={node.x} y={node.y} width={node.width} height={NODE_HEIGHT} />
            <text
              x={node.x + node.width / 2}
              y={node.y + NODE_HEIGHT / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className={styles['map-caption']}>
        The session shape behind every receipt: one orchestrator fans work to parallel agents; their
        output merges through a review gate into the shipped artifact.
      </figcaption>
    </figure>
  )
}
