# Studies area

Case-study surfaces live here: page-specific components, diagram exhibits,
extracted mapping data, and the Study B live demo. These are **not** DS
components — nothing in this directory gets a manifest entry, and the
`rake manifest:verify` drift gate does not scan it. Studies _compose_ the DS.

```
studies/
  agentic-design-ops/   Study A diagram + pattern-gallery components
  shadcn-to-polaris/    Study B extracted mapping data (typed modules)
  polaris-demo/         Study B live demo (isolated Polaris bundle)
```

## Rules that bind every file here

- **Prose slots, not prose.** Study narrative is written outside build
  sessions. Pages render labeled slots (`<ProseSlot id="…">` or an
  equivalent placeholder with a visible `Content slot: <id>` marker) —
  never draft study copy inline. Table content, diagram labels, and
  captions authored from extracted facts are fine; narrative paragraphs
  are not.
- **Fictional data only.** Demo seeds, table examples, and diagram labels
  use invented names — no real families, users, or production values, and
  no employer-internal system names. Neutral diagram labels
  ("Orchestrator", "Agent A", "Review gate") only.
- **Token discipline holds.** Local CSS consumes semantic tokens
  (`--color-*`, `--type-*`, `--space-*`…). The one sanctioned exception:
  the Polaris demo may _set_ `--p-*` custom properties (Polaris's own
  namespace) inside its container — see the motion contract below.
- **Motion goes through `useMotionPref()`** — including third-party
  motion. The demo zeroes Polaris's motion tokens under reduced motion.

## Polaris demo contract (Study B)

The Chores demo (Index / Create / Edit) is rebuilt with real
`@shopify/polaris@13.9.5` components and must stay **bundle-isolated**:
Polaris code and CSS never load on any other route.

### Module boundary

- Page component: `app/frontend/pages/work/shadcn-to-polaris-demo.tsx`
  (route `/work/shadcn-to-polaris/demo`, action
  `work#shadcn_to_polaris_demo`). The page renders site-DS chrome — title,
  intro slot, the state switcher, back link — and mounts the demo via a
  **dynamic import only**:
  `void import('@/studies/polaris-demo/PolarisDemo')` inside an effect
  (the `AssemblyOpening` motion-chunk pattern). No static import of
  anything under `studies/polaris-demo/` outside that directory.
- The lazy entry is named `PolarisDemo.tsx` so the emitted chunk is
  greppable (`PolarisDemo-*.js`) for the network-level e2e assertions.
- `@shopify/polaris` / `@shopify/polaris-icons` may be imported **only**
  under `studies/polaris-demo/`.

### CSS lifecycle (the leak problem)

Polaris's stylesheet carries global resets (`html, body { font-size:
13px; color: … }`, `h1–h6, p { margin: 0 }`). A normal lazy CSS chunk
would persist after client-side navigation away and restyle the site.
Therefore:

- Import the stylesheet as a string:
  `import polarisCss from '@shopify/polaris/build/esm/styles.css?inline'`.
- On demo mount, inject one `<style data-polaris-demo-styles>` element
  into `<head>`; on unmount, remove it. No other mechanism may load
  Polaris CSS.
- The injected element's content is `polarisCss + SITE_GUARD`, where
  `SITE_GUARD` re-asserts the site's inheritance chain at higher
  specificity than Polaris's element selectors, so shell chrome outside
  the demo container keeps its geometry while the demo is mounted:

  ```css
  html[data-skin] {
    font-size: 100%;
    line-height: normal;
    font-weight: 400;
    letter-spacing: normal;
    font-feature-settings: normal;
    color: var(--color-ink);
  }
  html[data-skin] body {
    font-size: inherit;
    line-height: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    font-feature-settings: inherit;
    color: inherit;
  }
  ```

- Everything the demo _page_ renders outside the Polaris container sets
  explicit `margin` and type tokens in its module CSS (Polaris's
  `h1–h6, p` reset is active while mounted — never rely on UA defaults
  there).

### Demo composition

- Root: `AppProvider` (i18n from `@shopify/polaris/locales/en.json`)
  inside a `<div data-polaris-demo-root>`. Deliberately **no `Frame`**:
  Frame renders its own nested `<main>` landmark, which cannot pass the
  zero-axe bar inside a page that already has one — so the demo also
  avoids `Toast` (Frame-dependent) in favor of a dismissible `Banner`.
- Views: `index` (Polaris `Page` + `IndexTable` or `ResourceList`,
  filter/sort client-side against the fetched payload), `create` and
  `edit` (Polaris `FormLayout`/`TextField`/`Select`/`Checkbox`/`Modal`
  for delete-confirm on edit). View state lives in a `view` query param
  (`?view=create`, `?view=edit&chore=<id>`) read client-side — no extra
  Rails routes, back-button friendly.
- **Form submits are client-simulated**: full Polaris validation UX;
  a successful submit shows a dismissible success Banner ("Demo only —
  nothing is persisted") and returns to the index view. No POST/PATCH
  requests exist.
- **Reduced motion:** when `useMotionPref().reduced` is true, the demo
  root gets a class that sets every `--p-motion-duration-*` token to
  `0ms` (enumerate from `@shopify/polaris-tokens` motion group). Polaris
  transitions collapse to instant; nothing bypasses the gate.

### State switcher

Site-DS control (fieldset of radio segments, playground idiom), rendered
by the _page_, outside the Polaris container — it must stay operable
while the demo shows loading/error. Options: `success` / `loading` /
`empty` / `error`. The selected state drives the fetch loop below and is
reflected as `data-state` on `[data-polaris-demo-root]`.

### Demo API (served by Rails — the four states are real responses)

`GET /demo/api/chores?state=<s>&latency=<ms>`

- `latency`: integer ms, clamped to `0..2000`, default `450`. The server
  sleeps before every response — skeletons are real network time.
- `state=success` (default) → `200 { "state": "success", "chores": [...],
"households": [...] }`
- `state=empty` → `200 { "state": "empty", "chores": [],
"households": [...] }`
- `state=error` → `500 { "state": "error", "error": { "code":
"demo_simulated_failure", "message": "Simulated upstream failure." } }`
- `state=loading` → sleeps a fixed `1200ms` (ignores `latency`, bounded —
  never holds a server thread longer) → `200 { "state": "loading",
"chores": [] }`. The client keeps its skeleton and re-polls (~600ms
  after each response) for as long as the switcher stays on `loading`;
  switching away aborts the in-flight request.

`GET /demo/api/chores/:id?latency=<ms>` → `200 { "chore": {...} }` with
full `steps` + `assignees`; unknown id → `404 { "state": "error", … }`.
Used when opening the edit view, so Edit demonstrates its own loading
state.

### Chore JSON shape (both endpoints, camelCase-free — raw column style)

```json
{
  "id": 3,
  "title": "Water the balcony plants",
  "description": null,
  "points": 10,
  "recurrence": { "type": "weekly", "day_of_week": 6 },
  "scheduled_time": "16:30",
  "requires_verification": false,
  "is_sharable": true,
  "is_multi_step": true,
  "steps": [{ "id": 7, "title": "Fill the watering can", "position": 1 }],
  "assignees": [{ "id": 2, "name": "Wren", "hue": 210 }],
  "household": { "id": 1, "name": "Alder Row" }
}
```

`recurrence` is `null` for one-time chores; `type` ∈ `daily | weekly |
monthly`, with `day_of_week` (0–6) only for weekly and `day_of_month`
(1–28) only for monthly. Household shape:
`{ "id", "name", "hue", "children": [{ "id", "name", "hue" }] }`.

### Seed texture (deterministic, idempotent, fictional)

2 households · 5 children · 9 chores covering: one-time / daily / weekly /
monthly; ≥2 multi-step (with ordered steps); ≥2 sharable with multiple
assignees; ≥3 requiring verification; ≥1 with a description; ≥1
unassigned. Fixed ids so the payload is byte-stable across reseeds.

### Test hooks

- `[data-polaris-demo-root]` — mounted demo container; carries
  `data-state` (current switcher state) and `data-view`
  (`index | create | edit`).
- `[data-testid="demo-state-switcher"]` — the site-DS control.
- Injected style element: `style[data-polaris-demo-styles]`.
- Chunk-name assertions: demo chunk matches `/PolarisDemo/`; core routes
  must fetch **zero** JS matching `/polaris/i` and must never carry
  `style[data-polaris-demo-styles]`.
