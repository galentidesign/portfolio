// TypeScript types for data/manifest/*.yml entries.
// These are the exact shapes received as the `entry` prop on
// /system/components/:slug pages rendered by the parallel server agent.

export interface ManifestProp {
  name: string
  /**
   * TS type string as it appears in the manifest, e.g.
   *   "'primary' | 'secondary' | 'ghost'"  — union of quoted literals → enum
   *   'boolean'                             — checkbox switch
   *   'string'                              — text input
   *   anything else                         — skipped by playground
   */
  type: string
  /**
   * Default value as a YAML string. Single-quoted literals retain their
   * surrounding quotes (e.g. "'primary'"). Booleans appear without quotes
   * (e.g. 'false'). Absent = required prop (em dash in the props table).
   */
  default?: string
  description: string
  /** Set to false to opt a prop out of playground control generation. */
  playground?: false
}

export interface ManifestA11yKeyboard {
  keys: string
  does: string
}

export interface ManifestA11y {
  keyboard: ManifestA11yKeyboard[]
  aria: string[]
  contrast: string
}

export interface ManifestLinks {
  repo: string
  /** Full Figma node URL, or null when the M7 library port is pending. */
  figma: string | null
}

export interface ManifestEntry {
  slug: string
  name: string
  tier: 'hero' | 'gallery'
  status: 'draft' | 'stable'
  description: string
  variants?: Record<string, string[]>
  props: ManifestProp[]
  tokens: string[]
  a11y: ManifestA11y
  usage: {
    do: string[]
    dont: string[]
  }
  example: string
  links: ManifestLinks
}
