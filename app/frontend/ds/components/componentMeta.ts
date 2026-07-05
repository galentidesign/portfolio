// Shared meta types for DS components. Every component exports
// `meta: ComponentMeta` from its meta.ts — a JSON-serializable literal that
// the manifest drift check (M3, `rake manifest:verify`) cross-references
// against data/manifest/<slug>.yml.

export interface PropMeta {
  name: string
  /** TS-ish type string, e.g. "'primary' | 'secondary' | 'ghost'" */
  type: string
  /** Literal rendered as code, e.g. "'primary'" — omit when required */
  default?: string
  description: string
}

export interface ComponentMeta {
  /** kebab-case, matches the manifest filename (e.g. 'form-field') */
  slug: string
  /** Display name (e.g. 'Form Field') */
  name: string
  tier: 'hero' | 'gallery'
  /** One-liner for index/gallery listings */
  description: string
  /**
   * Variant axes rendered as data-* attributes on the component root,
   * e.g. { variant: ['primary', 'secondary'], size: ['sm', 'md'] }.
   * Keys and values must match the rendered data-attributes exactly.
   */
  variants: Readonly<Record<string, readonly string[]>>
  props: readonly PropMeta[]
}
