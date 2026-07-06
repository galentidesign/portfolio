// Types for Study B: shadcn → Polaris migration mapping data.
// These modules are data — no JSX, no runtime deps beyond TypeScript.
// Source verified against:
//   CoBlend: resources/css/app.css (@theme + :root HSL triplets, .dark overrides, .theme-* palettes)
//   Polaris: node_modules/@shopify/polaris-tokens/dist/css/styles.css (v9.4.2)
//   Polaris components: node_modules/@shopify/polaris/build/ts/src/components/**/*.d.ts (v13.9.5)

export type Classification = 'clean' | 'mismatch' | 'standardized'

/**
 * One row in the token translation table.
 * Source is CoBlend's @theme / :root definitions (Tailwind v4, config-less).
 * Target is @shopify/polaris-tokens@9.4.2 CSS custom properties.
 */
export interface TokenRow {
  id: string
  /** CSS custom property name (or class selector) in CoBlend. */
  sourceToken: string
  /** Display-ready value (font stack, hsl(…), rem, or description). */
  sourceValue: string
  /** CSS-compatible color for a swatch, if this token is a color; else undefined. */
  swatchColor?: string
  /** CSS custom property name in polaris-tokens, or 'none' when no equivalent exists. */
  polarisToken: string
  /** Display-ready value from polaris-tokens dist/css/styles.css, or '—'. */
  polarisValue: string
  /** CSS-compatible color for the Polaris swatch, if applicable; else undefined. */
  polarisSwatch?: string
  /** One-sentence factual note about the mapping. */
  note: string
  classification: Classification
}

/**
 * One row in the component API mapping table.
 * Component universe = every component used in the CoBlend Chores flow.
 */
export interface ApiRow {
  id: string
  /** CoBlend component name as it appears in the Chores flow. */
  component: string
  /** Key CoBlend API surface (library, variant props, notable patterns). */
  coBlendApi: string
  /** Polaris component name, or 'none' when no equivalent exists. */
  polarisComponent: string
  /** Key Polaris prop API, or '—'. */
  polarisApi: string
  /** One-sentence migration note. */
  note: string
  classification: Classification
}

/**
 * One row in the a11y analysis table.
 * Covers WCAG 2.1 AA concerns surfaced by the Chores flow components.
 */
export interface A11yRow {
  id: string
  /** The accessibility concern or WCAG success criterion. */
  concern: string
  /** How CoBlend handles this concern. */
  coBlendBehavior: string
  /** How Polaris handles the same concern. */
  polarisBehavior: string
  /** One-sentence factual note. */
  note: string
  classification: Classification
}
