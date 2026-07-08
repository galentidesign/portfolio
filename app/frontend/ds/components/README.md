# DS components

Sixteen components, one contract. Every component here is a pure function of
the token engine (`../tokens/README.md`): re-skin the site and nothing in
this directory changes — that invariant is lint-enforced and CI-tested
across skins.

## Directory template

```
ds/components/<Name>/          # PascalCase dir, e.g. FormField
  <Name>.tsx                   # named export function + <Name>Props interface
  styles.module.css            # kebab-case classes, semantic tokens only
  meta.ts                      # `export const meta = {…} as const satisfies ComponentMeta`
  <Name>.test.tsx              # behavioral tests (see bar below)
  gallery.tsx                  # demo the scratch gallery auto-discovers
```

Import as `@/ds/components/<Name>/<Name>` — no barrels (they drag every
component's CSS into any consumer).

## API conventions

- **Named exports only**; props interface exported as `<Name>Props`.
- **React 19 ref-as-prop** — take `ref` as a normal prop when a component
  should expose its root element; never `forwardRef`.
- **Variant axes are `data-*` attributes** on a single root class:
  `<button className={styles.button} data-variant="primary" data-size="sm">`
  styled as `.button[data-variant='primary']`. Boolean states that need
  styling are also data-attributes (`data-invalid`, `data-inline`). Never
  class-name matrices. `meta.ts#variants` must mirror the rendered axes
  exactly — the M3 drift check depends on it.
- Controlled props follow React idiom: `value`/`onChange`,
  `open`/`onClose`, `selected`/`onChange` (+ `defaultSelected` where an
  uncontrolled mode is worth having).
- Spread unknown rest props onto the root element only when the component is
  a thin wrapper over a native element (Button, FormField's control).

## Styling rules

- **Semantic tokens only** — `--color-*`, `--radius-*`, `--type-*`,
  `--density-*`, `--motion-*`, `--shadow-*`, `--space-*`, `--z-*`. The
  no-raw lint wall is CI-fatal. Hardcoded values are allowed only for
  1px hairlines and true structural micro-values, each with a comment.
- Control heights: `--density-control` (md) / `--density-control-sm` (sm).
  Rows: `--density-row`. Gaps: `--space-*` or `--density-gap`.
- Type comes from role tokens (`--type-body-*`, `--type-small-*`,
  `--type-mono-*`…) — never bare font-size/family.
- **Focus recipe** (every focusable, `:focus-visible` only):
  `outline: 2px solid var(--color-focus); outline-offset: 2px;`
- **Motion**: CSS transitions/animations must use `--motion-duration-*` +
  `--motion-ease-*` (they collapse to 0ms under reduced motion). JS-driven
  animation gates through `useMotionPref()` — no exceptions. Entry/exit
  effects must be content-complete when durations are 0.

## A11y ground rules (build-time, not retrofit)

- Full keyboard operation per the relevant WAI-ARIA APG pattern; roving
  tabindex where the pattern says so; `Escape` always dismisses transient
  surfaces and returns focus to the trigger.
- Native elements first: `<button>`, `<dialog>`, `<table>`, real inputs.
  ARIA only adds what HTML can't say.
- Interactive targets are at least `--density-control-sm` tall.
- Color pairs come from the token contract's documented pairings (ink on
  surface, accent-ink on accent, X on X-surface) — both shipped skins pass
  WCAG on those pairs by construction; inventing new combinations is how you
  fail the axe matrix.

## meta.ts

```ts
import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'button',
  name: 'Button',
  tier: 'hero',
  description: 'Actions at three emphasis levels.',
  variants: {
    variant: ['primary', 'secondary', 'ghost'],
    size: ['sm', 'md'],
  },
  props: [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'ghost'",
      default: "'primary'",
      description: 'Emphasis level.',
    },
    // …every public prop
  ],
} as const satisfies ComponentMeta
```

## gallery.tsx

```tsx
export const galleryMeta = { slug: 'button', title: 'Button' }

export default function ButtonGallery() {
  return <div>{/* labeled rows covering every variant axis + key states */}</div>
}
```

Demos must be self-contained (local state only), render every variant-axis
value and the states worth seeing (invalid, busy, empty…), and be axe-clean
under both skins — the manifest-driven doc pages (`/system/components/:slug`)
glob these files and embed them as the page's live-variants section.

## playground.tsx

```tsx
import type { PlaygroundHostProps } from '../playground'
import { Button } from './Button'

export const playgroundMeta = { slug: 'button' }

export default function ButtonPlayground({ values }: PlaygroundHostProps) {
  return <Button {...values}>Save changes</Button>
}

export function snippet(attrs: string) {
  return `<Button${attrs}>Save changes</Button>`
}
```

Components ship a playground host next to `gallery.tsx` when their props
support generated controls; doc pages glob these too. Content-driven
components (prose, skin-switcher, tabs) omit one. The page generates the
controls from the manifest
(`data/manifest/README.md` — enum → segmented control, boolean → switch,
string → text input) and hands the host only the values to apply. Hosts stay
dumb: spread `values`, provide self-contained demo content (a trigger for
overlay components, fixed rows for Table), and keep `snippet` in sync with
what's rendered. Props a host must own itself (e.g. Dialog's `open`) are
opted out with `playground: false` in the manifest.

## Test bar (per component)

Behavioral assertions with Testing Library + user-event — no snapshots:

1. Renders each variant-axis value (assert the data-attribute, not pixels).
2. Keyboard: every interaction the APG pattern names (activation, arrows,
   Home/End, Escape-with-focus-return) exercised via `userEvent`.
3. ARIA wiring: roles, `aria-*` relationships (labelledby/describedby/
   controls/activedescendant), live-region roles where used.
4. Controlled-prop contract: callbacks fire with the right values; no
   internal state fights the owner.
