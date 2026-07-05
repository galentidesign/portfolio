// Playground host contract (M3). Hero components ship a playground.tsx next
// to gallery.tsx; the doc page at /system/components/:slug generates prop
// controls from the manifest (data/manifest/<slug>.yml) and renders the host
// with the live values. Gallery-tier components have no playground.

import type { ComponentType } from 'react'

/**
 * Current control state, keyed by prop name. Only props to actually apply:
 * enum/string props as strings (empty strings are omitted before the host
 * sees them), booleans as booleans.
 */
export type PlaygroundValues = Record<string, string | boolean>

export interface PlaygroundHostProps {
  values: PlaygroundValues
}

export interface PlaygroundModule {
  playgroundMeta: { slug: string }
  /**
   * Renders the live component with `values` spread on plus self-contained
   * demo content (children, table rows, a trigger for overlay components…).
   */
  default: ComponentType<PlaygroundHostProps>
  /**
   * Code snippet for the current state. `attrs` is the pre-formatted
   * attribute string for every non-default value — empty, or with a leading
   * space (e.g. ` variant="ghost" busy`) — ready to interpolate after the
   * component name.
   */
  snippet: (attrs: string, values: PlaygroundValues) => string
}
