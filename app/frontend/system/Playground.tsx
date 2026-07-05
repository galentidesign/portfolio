import { Fragment, useState } from 'react'
import { CodeBlock } from '@/ds/components/CodeBlock/CodeBlock'
import { FormField } from '@/ds/components/FormField/FormField'
import type { PlaygroundModule, PlaygroundValues } from '@/ds/components/playground'
import type { ManifestEntry, ManifestProp } from './manifest'
import styles from './playground.module.css'

// ── Type-heuristic helpers ────────────────────────────────────────────────

/**
 * Returns the array of literal values when the type string is a union of
 * single-quoted string literals — e.g. "'a' | 'b' | 'c'" → ['a', 'b', 'c'].
 * Returns null for any other type.
 */
function parseEnum(type: string): string[] | null {
  const parts = type.split(' | ').map((s) => s.trim())
  if (parts.length > 0 && parts.every((p) => /^'[^']+'$/.test(p))) {
    return parts.map((p) => p.slice(1, -1))
  }
  return null
}

/**
 * Strips surrounding single quotes from a manifest default string.
 * "'primary'" → "primary"; "false" → "false" (no-op when no quotes).
 */
function stripQuotes(raw: string): string {
  return raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw
}

/**
 * Returns the initial control value for a given prop, or null when the prop
 * should be skipped (non-scalar type or explicitly opted out).
 */
function getInitialValue(prop: ManifestProp): string | boolean | null {
  if (prop.playground === false) return null

  const enumVals = parseEnum(prop.type)

  if (enumVals !== null) {
    if (prop.default === undefined) return enumVals[0]
    return stripQuotes(prop.default)
  }

  if (prop.type === 'boolean') {
    if (prop.default === undefined) return false
    return stripQuotes(prop.default) === 'true'
  }

  if (prop.type === 'string') {
    if (prop.default === undefined) return ''
    return stripQuotes(prop.default)
  }

  return null // non-scalar: skip
}

/**
 * Builds the formatted attribute string for the snippet, listing only props
 * that differ from their defaults, in manifest prop order.
 *
 * - enum/string → ` name="value"` (empty string → omitted)
 * - boolean true → ` name`
 * - boolean false when default was true → ` name={false}`
 */
function buildAttrs(entry: ManifestEntry, values: Record<string, string | boolean>): string {
  let attrs = ''

  for (const prop of entry.props) {
    if (prop.playground === false) continue
    const enumVals = parseEnum(prop.type)
    const isBool = prop.type === 'boolean'
    const isStr = prop.type === 'string'
    if (enumVals === null && !isBool && !isStr) continue

    const value = values[prop.name]
    const defaultVal = getInitialValue(prop)

    if (value === defaultVal) continue // no change

    if (isBool) {
      if (value === true) {
        attrs += ` ${prop.name}`
      } else {
        // false when default was true
        attrs += ` ${prop.name}={false}`
      }
    } else if (typeof value === 'string' && value !== '') {
      attrs += ` ${prop.name}="${value}"`
    }
  }

  return attrs
}

// ── Props ─────────────────────────────────────────────────────────────────

export interface PlaygroundProps {
  entry: ManifestEntry
  host: PlaygroundModule
}

// ── Component ─────────────────────────────────────────────────────────────

export function Playground({ entry, host }: PlaygroundProps) {
  // Initialize state from manifest defaults
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {}
    for (const prop of entry.props) {
      const v = getInitialValue(prop)
      if (v !== null) {
        init[prop.name] = v
      }
    }
    return init
  })

  const update = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  // Host receives strings only when non-empty; booleans always
  const hostValues: PlaygroundValues = Object.fromEntries(
    Object.entries(values).filter(([, v]) => typeof v === 'boolean' || v !== ''),
  )

  const attrs = buildAttrs(entry, values)
  const HostComponent = host.default

  return (
    <div className={styles.playground}>
      {/* Live stage */}
      <div className={styles['stage-frame']} data-testid="playground-stage">
        <HostComponent values={hostValues} />
      </div>

      {/* Generated controls */}
      <div className={styles.controls}>
        {entry.props.map((prop) => {
          if (prop.playground === false) return null

          const enumVals = parseEnum(prop.type)

          // Segmented control for enum props
          if (enumVals !== null) {
            const current = values[prop.name] as string
            return (
              <fieldset key={prop.name} className={styles['segments-fieldset']} role="radiogroup">
                <legend className={styles['segments-legend']}>{prop.name}</legend>
                <div className={styles.segments}>
                  {enumVals.map((option) => {
                    const radioId = `pg-${prop.name}-${option}`
                    return (
                      <Fragment key={option}>
                        <input
                          type="radio"
                          id={radioId}
                          name={`pg-${prop.name}`}
                          value={option}
                          checked={current === option}
                          onChange={() => update(prop.name, option)}
                          className={styles['segment-radio']}
                        />
                        <label htmlFor={radioId} className={styles['segment-label']}>
                          {option}
                        </label>
                      </Fragment>
                    )
                  })}
                </div>
              </fieldset>
            )
          }

          // Switch for boolean props
          if (prop.type === 'boolean') {
            const checked = values[prop.name] as boolean
            return (
              <div key={prop.name} className={styles['switch-wrap']}>
                <span className={styles['switch-group-label']} aria-hidden="true">
                  {prop.name}
                </span>
                <label className={styles['switch-label']}>
                  <input
                    type="checkbox"
                    className={styles['switch-input']}
                    checked={checked}
                    aria-label={prop.name}
                    onChange={(e) => update(prop.name, e.target.checked)}
                  />
                  <span className={styles['switch-visual']} aria-hidden="true">
                    <span className={styles['switch-thumb']} />
                  </span>
                </label>
              </div>
            )
          }

          // Text input for string props
          if (prop.type === 'string') {
            const strVal = values[prop.name] as string
            return (
              <div key={prop.name} className={styles['string-control']}>
                <FormField
                  label={prop.name}
                  value={strVal}
                  onChange={(e) => update(prop.name, e.target.value)}
                />
              </div>
            )
          }

          return null // non-scalar props are skipped
        })}
      </div>

      {/* Live code snippet */}
      <div className={styles.snippet}>
        <CodeBlock code={host.snippet(attrs, hostValues)} label="Snippet" />
      </div>
    </div>
  )
}
