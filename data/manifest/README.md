# Component manifest

One YAML file per DS component — `<slug>.yml`, where `slug` matches the
component's `meta.ts#slug`. The manifest is the single source the DS doc
pages are generated from: the `/system` index, the sidebar nav, and every
`/system/components/:slug` page are pure functions of these files. There are
no hand-built doc pages; a component without a manifest entry has no docs,
and `rake manifest:verify` (CI) fails the build over it.

## Schema

```yaml
slug: button # kebab-case; == filename == meta.ts slug
name: Button # display name          == meta.ts name
tier: hero # hero | gallery        == meta.ts tier
status: stable # draft | stable (manifest-only; no meta.ts counterpart)
description: One-liner for the index card and page header.

# Variant axes — must mirror meta.ts#variants exactly (axes, values, order).
variants:
  variant: [primary, secondary, ghost]
  size: [sm, md]

# Public props — must mirror meta.ts#props: same name set, and per prop the
# same `type` and `default` strings. Descriptions may be richer here (the
# manifest is the doc source); meta.ts descriptions serve code readers.
props:
  - name: variant
    type: "'primary' | 'secondary' | 'ghost'" # exact meta.ts type string
    default: "'primary'" # exact meta.ts default literal; omit when required
    description: Doc-page prose for the props table.
    # playground: false                # opt this prop out of generated controls

# Semantic tokens the component consumes — sorted, deduped. Must equal the
# set of var(--…) references in styles.module.css + <Name>.tsx (semantic
# prefixes only: --color --radius --type --density --motion --shadow
# --space --z). Drift-checked.
tokens:
  - --color-accent

# A11y notes rendered on the doc page.
a11y:
  keyboard: # the keyboard map, one row per gesture
    - keys: Enter / Space
      does: Activates the button.
  aria: # ARIA wiring notes, one string per point
    - busy sets aria-busy and suppresses activation without removing focus.
  contrast: >- # one sentence naming the token pairs used
    Uses the documented accent-ink-on-accent and ink-on-surface pairs.

usage:
  do:
    - Short imperative guidance.
  dont:
    - Short imperative anti-pattern.

# Verbatim TSX for the doc page's code example — include the import line.
example: |
  import { Button } from '@/ds/components/Button/Button'

  <Button variant="primary" onClick={save}>Save changes</Button>

links:
  repo: app/frontend/ds/components/Button # path in this repo; page builds the GitHub URL
  figma: null # real library node link, written back as each M7 port lands
```

## Validation vs drift

Two layers keep this honest:

- **`Manifest` model (boot)** — shape validation: required keys, enum values,
  types, unique slugs, slug/filename agreement, semantic-prefix check on
  `tokens`, `links.figma` null-or-figma-URL.
- **`rake manifest:verify` (CI)** — cross-source drift: every component dir
  (`app/frontend/ds/components/*/` with a `meta.ts`) has a manifest file and
  vice versa; `name`/`tier`/`variants`/`props` (name + type + default) agree
  with `meta.ts` in both directions; `tokens` equals the semantic var() set
  actually referenced by the component's CSS/TSX; `links.repo` points at the
  component's real directory.

Scalars that YAML would coerce (`false`, `true`, numbers) are compared as
strings by the drift check, but quote them anyway (`default: 'false'`) so the
file reads as what it means. Same for prose list items containing `: ` (e.g.
`- Roving focus: one item…`, `pointer-events: none`) — unquoted, YAML parses
them as single-key hashes, and boot validation rejects them.

## Playground

The props playground on doc pages of components that ship a playground.tsx
generates its controls from `props`:

- union-of-string-literals type → segmented control
- `boolean` → switch
- `string` → text input (empty = prop omitted)
- anything else (ReactNode, handlers, refs, unions of non-literals) — skipped
  automatically; `playground: false` force-skips a prop whose type would
  otherwise get a control (e.g. controlled `open` props the host manages).

Initial values come from `default` (quotes stripped; missing default: enums
start on their first value, booleans on false, strings empty).
