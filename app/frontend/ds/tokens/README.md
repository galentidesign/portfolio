# Token engine

Everything visual on this site passes through here. Skins are data: one JSON
file per skin, compiled to scoped CSS custom properties, a typed TypeScript
registry, and a JSON manifest for Rails. **Adding a skin = adding one JSON file
and rebuilding — zero component edits.** If a new skin ever needs a component
change, the schema is the bug.

## Source files

- `base.tokens.json` — skin-invariant primitives: `space` (spacing scale), `z`
  (stacking scale), `breakpoint` (viewport thresholds).
- `<skin>.tokens.json` — one per skin: `meta`, `raw` primitives, `semantic`
  tokens.

### Skin file shape

```jsonc
{
  "meta": {
    "name": "galenti", // must match filename stem, kebab-case
    "label": "Galenti", // human label for switcher UI
    "era": "own-brand", // era metadata for the story engine
    "colorScheme": "light", // "light" | "dark" — emitted as CSS color-scheme
    "default": true, // exactly one skin may set this
    "hidden": false, // hidden skins are omitted from switcher UIs
    "description": "…", // one line, shown on /system/tokens
    "fonts": [
      // self-hosted faces this skin needs (may be [])
      {
        "family": "Hanken Grotesk",
        "file": "hanken-grotesk-latin-wght.woff2", // in app/frontend/assets/fonts/
        "weight": "100 900", // variable range (or single weight)
        "style": "normal",
        "display": "swap",
        "preload": true, // Rails emits a <link rel=preload> when active
      },
    ],
  },
  "raw": {
    // primitive layer — literals only
    "color": { "bone-100": "#fcf9f3" },
    "font": { "sans": "'Hanken Grotesk', system-ui, sans-serif" },
  },
  "semantic": {
    // the only layer components may consume
    "color": { "surface": "{raw.color.bone-100}" },
    "radius": { "control": "4px" },
    "type": { "body-size": "1.0625rem" },
    "density": { "gap": "var(--space-4)" },
    "motion": { "duration-md": "240ms" },
    "shadow": { "raised": "0 1px 2px rgb(34 30 23 / 6%)" },
  },
}
```

- **Reference grammar:** `{raw.<group>.<key>}` may appear anywhere inside a
  semantic value string (multiple refs per value are fine) and compiles to
  `var(--raw-<group>-<key>)`. Refs must resolve within the same skin file.
  Raw and base values are literals only.
- Semantic values may also reference base primitives literally via
  `var(--space-*)` / `var(--z-*)` — those exist on `:root` at runtime.
- All keys are kebab-case (numeric segments allowed).

### The parity rule (validated, build-fails)

Every skin must define the **identical set of semantic keys** across the six
namespaces `color · radius · type · density · motion · shadow`. This is what
makes skins additive: components can rely on every semantic token existing in
every skin. The build hard-fails on missing/extra keys, unresolved refs,
duplicate/missing `default`, meta shape errors, or a `fonts[].file` that isn't
in `app/frontend/assets/fonts/`.

## Semantic contract (v1)

- `--color-*`: `surface`, `surface-raised`, `surface-sunken`, `surface-overlay`,
  `ink`, `ink-muted`, `ink-faint`, `accent`, `accent-ink`, `accent-muted`,
  `line`, `line-strong`, `focus`, `positive`, `positive-surface`, `caution`,
  `caution-surface`, `critical`, `critical-surface`.
  `ink-faint` is decorative/disabled text only; every skin still keeps it
  ≥ 4.5:1 on `surface`. `*-ink` means "text on that ground".
- `--radius-*`: `control` (buttons/inputs), `surface` (cards/panels), `pill`.
- `--type-<role>-<attr>`: roles `display · heading · title · body · small ·
mono`, attrs `family · size · weight · line · tracking`.
- `--density-*`: `row` (list/table rows), `control` (control height),
  `control-sm` (small-size controls), `gap` (default stack gap), `pad`
  (container padding).
- `--motion-duration-{xs,sm,md,lg,xl}`, `--motion-ease-{enter,exit,move}`.
- `--shadow-*`: `raised`, `overlay`.

Base (`:root`, skin-invariant): `--space-{0..10}`, `--z-{base,raised,nav,
overlay,palette,toast,skip}`. Breakpoints are **not** emitted as custom
properties (they can't work in media queries); they compile to
`@custom-media --bp-{sm,md,lg,xl}` rules (usable in any component CSS via
PostCSS) and to the `breakpoints` export in `skins.ts`.

## Generated artifacts (`generated/`, gitignored)

`npm run tokens:build` (also runs inside every Vite build/dev boot) emits:

| File                   | What                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.css`             | `:root { --space-*, --z-* }`                                                                                                                               |
| `skin-<name>.css`      | `[data-skin='<name>'] { color-scheme; --raw-*; semantic tokens }`                                                                                          |
| `fonts.css`            | deduped `@font-face` for all skins (`url('../../../assets/fonts/…')`)                                                                                      |
| `motion-overrides.css` | zeroes all `--motion-duration-*` under `:root[data-motion='reduced']` and `@media (prefers-reduced-motion: reduce)` — imported last so it wins the cascade |
| `custom-media.css`     | `@custom-media --bp-* (min-width: …)` — injected into all component CSS at build time, never imported at runtime                                           |
| `index.css`            | imports fonts → base → skins (default first) → motion-overrides                                                                                            |
| `skins.ts`             | typed registry (below)                                                                                                                                     |
| `skins.json`           | the same registry for Rails (server-side skin resolution + font preloads)                                                                                  |

### `skins.ts` exports (pinned interface)

```ts
export interface SkinMeta {
  name: string
  label: string
  era: string
  colorScheme: 'light' | 'dark'
  default: boolean
  hidden: boolean
  description: string
}
export const skins: readonly SkinMeta[] // default skin first
export const skinNames: readonly string[] // as const — SkinName derives from it
export type SkinName = (typeof skinNames)[number]
export const defaultSkin: SkinMeta
export const semanticTokens: Record<
  'color' | 'radius' | 'type' | 'density' | 'motion' | 'shadow',
  readonly string[]
> // CSS custom property names
export const baseTokens: Record<'space' | 'z', readonly string[]>
export const breakpoints: Record<string, string>
export const SKIN_STORAGE_KEY: string // 'portfolio:skin'
export const MOTION_STORAGE_KEY: string // 'portfolio:motion'
```

### `skins.json` shape (pinned)

```jsonc
{
  "default": "galenti",
  "storage": { "skin": "portfolio:skin", "motion": "portfolio:motion" },
  "skins": [
    {
      "name": "galenti",
      "label": "Galenti",
      "era": "own-brand",
      "colorScheme": "light",
      "hidden": false,
      "description": "…",
      "preloadFonts": ["fonts/hanken-grotesk-latin-wght.woff2"],
    },
  ],
}
```

## Skin application (runtime semantics)

- `<html data-skin="…">` is rendered **server-side**: a valid `?skin=` param
  wins, else the default. A tiny inline pre-paint script then applies a stored
  `localStorage['portfolio:skin']` preference — but never overrides an explicit
  valid `?skin=` param — and applies `localStorage['portfolio:motion']`
  (`'reduced'`) as `data-motion="reduced"`.
- Client-side, `SkinProvider` treats the `data-skin` attribute as the source of
  truth on mount; `setSkin(name, { persist })` updates attribute + state and
  (when persisting) localStorage. Story-driven re-themes pass
  `persist: false`.
- Motion: reduced is true when the OS media query **or** the manual toggle says
  so. CSS durations collapse to `0ms` via `motion-overrides.css`; JS animation
  code must gate through `useMotionPref()` — no exceptions.

## Discipline

- Components consume **semantic tokens only**. Any `--raw-*` outside
  `generated/` fails `npm run lint:css` (custom stylelint rule
  `portfolio/no-raw-tokens`) and `npm run lint:tokens` (repo-wide sweep,
  catches TSX inline styles too).
- Generated files are never edited or committed; the build is deterministic
  (stable key order) so two runs produce identical output.
