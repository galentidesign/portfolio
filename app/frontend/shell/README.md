# Shell contract — dual-mode site shell (M4)

The shell is the persistent chrome around every page: the Nav bar (with ⌘K
palette), the story-mode escape hatch, the mode memory, and the notice host.
Pages render inside it. This file pins the interfaces and design decisions so
shell pieces can be built in parallel; it stays as the shell's reference doc.

## Architecture

- `SiteShell` is a **persistent Inertia layout**: `entrypoints/inertia.tsx`
  assigns `page.default.layout = (page) => <SiteShell>{page}</SiteShell>` in
  `resolve` — only when `layout === undefined` (an explicit check, not `??=`:
  a page opting out with `layout = null` must stay null). It survives
  client-side navigations (palette state, toast state, no bar re-mount). A
  page that must be chrome-free (full-bleed demo, OG templates — later
  milestones) opts out with `Component.layout = null`.
- `SiteShell` renders, in DOM order: `<Nav …/>`, the escape hatch (story
  routes only), the notice `Toast`, then `children`. **No `<main>` wrapper** —
  every page owns `<main id="main">` (the Nav skip link and hatch-free focus
  order depend on it). `/system` pages keep DocShell inside the site shell;
  DocShell no longer renders its own skip link (the shell's Nav provides it).
- Mode is a **route distinction** (spec §4): story = `/` and `/story/*`,
  skim = `/work` and `/work/*` (exact segments — an unmatched path like
  `/workshop` is a 404, not a skim visit). Everything else (system, resume,
  colophon, 404) is mode-neutral. `localStorage` remembers the last-used mode
  **only** to render a "continue" affordance — never redirects.

## Interfaces

### `shell/mode/useMode.ts`

```ts
export type Mode = 'story' | 'skim'
export const MODE_STORAGE_KEY = 'portfolio:mode'

/** Route → mode. '/', '/story/*' → 'story'; '/work', '/work/*' → 'skim'; else null. */
export function modeForPath(path: string): Mode | null

/** localStorage read, try/catch-guarded. */
export function getStoredMode(): Mode | null

/**
 * Call from SiteShell with the current path on every navigation.
 * Writes the derived mode to storage when non-null; neutral routes never
 * clobber the memory.
 */
export function useModeMemory(path: string): void
```

Continue-affordance semantics: SiteShell captures `getStoredMode()` **once at
mount, before the first write** (`useState(() => getStoredMode())`). If the
captured value is `'skim'`, the hatch label reads "Continue to the work →"
instead of "Skip to the work →". Cross-session memory only — the label does
not flip mid-session as the visitor navigates.

### `shell/actions.ts`

```ts
export const CONTACT_EMAIL = 'galentidesign@gmail.com'

export interface SiteActionDeps {
  /** Current path (usePage().url, query stripped). */
  currentPath: string
  skins: readonly SkinMeta[] // full registry; filter hidden here
  setSkin: (name: SkinName) => void
  visit: (href: string) => void // router.visit
  notify: (message: string) => void // SiteShell toast host
}

export function buildSiteActions(deps: SiteActionDeps): PaletteAction[]
```

Action inventory (ids are stable — tests key on them):

| id                  | label                       | group   | keywords                       | perform                  |
| ------------------- | --------------------------- | ------- | ------------------------------ | ------------------------ |
| `nav-story`         | Story — home                | Go      | home, story, start             | visit `/`                |
| `nav-work`          | Work — the skim hub         | Go      | work, skim, studies, portfolio | visit `/work`            |
| `nav-story-rails`   | Chapter 1 — The Rails era   | Go      | rails, chapter, 2014           | visit `/story/rails-era` |
| `nav-story-react`   | Chapter 2 — The React era   | Go      | react, chapter                 | visit `/story/react-era` |
| `nav-story-agentic` | Chapter 3 — The agentic era | Go      | agentic, ai, chapter           | visit `/story/agentic`   |
| `nav-system`        | Design system               | Go      | ds, tokens, components, system | visit `/system`          |
| `nav-resume`        | Résumé                      | Go      | resume, cv, pdf, download      | visit `/resume`          |
| `nav-colophon`      | Colophon                    | Go      | about, stack, craft, colophon  | visit `/colophon`        |
| `mode-skim`         | Switch to skim mode         | Mode    | toggle, mode, skim             | visit `/work`            |
| `mode-story`        | Switch to story mode        | Mode    | toggle, mode, story            | visit `/`                |
| `skin-<name>`       | Skin: <Label>               | Skin    | skin, theme, era               | `setSkin(name)`          |
| `copy-email`        | Copy email address          | Contact | email, contact, mail           | clipboard → notify       |

Rules: the mode group is contextual — on story routes offer only `mode-skim`,
on skim routes only `mode-story`, on neutral routes both. Skin actions cover
**non-hidden** registry entries only (debug stays a `?skin=` diagnostic; M6's
rails-era joins via the registry with zero shell edits). `copy-email` uses
`navigator.clipboard.writeText(CONTACT_EMAIL)` then
`notify('Email copied — ' + CONTACT_EMAIL)`; on clipboard failure fall back to
`window.location.href = 'mailto:' + CONTACT_EMAIL` (no notify).

### Nav `linkAs` prop (DS addition)

`Nav` gains `linkAs?: ElementType` (default `'a'`) rendered for the brand link
and item links so an Inertia app gets client-side visits. The skip link stays
a plain `<a href="#main">` (same-document jump). `meta.ts` + `data/manifest/
nav.yml` move together (drift gate). The palette needs no change — actions are
callbacks.

### SiteShell composition

- Nav config: brand `{ label: 'J Galenti', href: '/' }`; items
  `Work → /work`, `System → /system`, `Résumé → /resume`; `label="Site"`
  (**not** "Primary" — the nav doc page mounts demo Navs whose playground
  default is "Primary"; "Site" keeps every landmark name unique);
  `linkAs={Link}`; `current` derived from path prefix (`/work` → Work,
  `/system` → System, `/resume` → Résumé).
- Actions: `buildSiteActions` wired to `useSkin()`, `router.visit`, the toast
  host, and `usePage().url`.
- Toast host: single `useState<string | null>` notice; renders
  `<Toast tone="positive" open={notice !== null} autoHideMs={4000}
onDismiss={clear}>{notice}</Toast>` with `data-testid="shell-toast"`
  on a wrapper.
- Escape hatch (story routes only): an Inertia `<Link href="/work">` pill,
  `position: fixed; right: var(--space-5); bottom: var(--space-5);
z-index: var(--z-nav)`. Surface: `--color-surface-raised` bg,
  `--color-line` border, `--shadow-raised`, `--radius-pill`,
  `--type-small-*` type, ink text with accent on hover/focus, focus ring
  `--color-focus`. Label: "Skip to the work →" (or continue variant, above).
  No entrance animation; hover/focus transitions use motion tokens only (they
  collapse under reduced motion globally). `data-testid="escape-hatch"`.
  DOM position right after `<Nav/>` — early in tab order from the top of
  every story page, satisfying "visible from the first story viewport" both
  visually and for keyboard/AT users.

### `shell/story/ScrollProgress.tsx`

Story chapter pages (not `/`) mount a reading-progress rail: fixed top,
full-width track, 3px, accent fill scaled by scroll fraction
(`transform: scaleX`), `aria-hidden="true"` (decorative),
`data-testid="scroll-progress"`. rAF-throttled scroll/resize listeners;
position updates are state, not motion — they happen under reduced motion
too — but any smoothing/transition must go through the motion tokens /
`useMotionPref` gate (under reduced motion the fill snaps). Hidden entirely
when the document doesn't overflow.

## Page contracts

Every page: `<Head title="… — J Galenti" />` (home: "J Galenti") and
`<main id="main">` as the outermost landmark. Semantic tokens only.

- **`pages/home/index.tsx` (story landing):** three sections — (1) assembly
  slot: ≥60vh hero holding `<h1>J Galenti</h1>` + one-line positioning sub +
  a `--type-small` mono annotation marking where the M5 assembly opening
  lands; (2) prologue slot: short band, annotation "prologue · 2004–2013 —
  lands with the assembly opening"; (3) chapter gateway: three `Card`s
  (`href` to each chapter) — mono chapter number, title, one-line era
  summary (Ch1 "2014–2019 · the dense product years", Ch2 note the engine,
  Ch3 "the agentic era"). Bottom padding clears the fixed hatch
  (`padding-bottom: var(--space-10)`).
- **`pages/story/{rails-era,react-era,agentic}.tsx`:** chapter shells —
  ScrollProgress, header (mono "Chapter N · <era range>", `<h1>`), two or
  three `<section aria-labelledby>` content slots with mono annotations
  naming what lands there (M6 content, Ch1 re-theme note), footer handoff:
  Ch1→Ch2, Ch2→Ch3, Ch3→`/work` ("See the work →"). Tall enough to scroll
  (slots get min-heights) so progress is observable.
- **`pages/work/index.tsx` (skim hub, F layout):** single centered column
  (`max-width: 72rem`), four blocks in strict reading order —
  1. Thesis: mono annotation "The 90-second version", then the locked thesis
     as `--type-display`: "Design technologist — I architect enterprise-scale
     design systems, ship them in production code, and write the agentic-AI
     playbook for design orgs."
  2. Proof: two `Card`s side-by-side (stack < 720px) — Study A "Agentic
     design-ops" / Study B "shadcn → Polaris" + one-line summaries +
     "Read the study →" footer.
  3. System: full-width `Card` → `/system`: "The design system behind this
     site — 16 components · 2 skins · zero axe violations", one line on
     tokens-as-source-of-truth.
  4. Act: `Button` (primary, `href="/resume"`) "Résumé" + mailto link with
     visible address + GitHub repo link (`github.com/galentidesign/portfolio`).
     Section rhythm `--space-9`; thesis block top-padded `--space-8`.
- **Stubs** (`pages/resume/index.tsx`, `pages/colophon/index.tsx`,
  `pages/work/agentic-design-ops.tsx`, `pages/work/shadcn-to-polaris.tsx`):
  one screen — `<h1>`, one honest line ("This page lands with milestone N —
  the site is agent-built in public."), link back to `/work`. Shared CSS
  module per page dir; no shared stub component (they diverge at M8/M9).
- **`pages/errors/not-found.tsx`:** `EmptyState` dogfood — mono "404" as
  `icon`, title "Nothing is assembled at this address", description one line,
  `action`: primary `Button href="/"` "Start the story" + secondary
  `Button href="/work"` "Skip to the work". Served with HTTP 404 by all
  unmatched routes and unknown system slugs.

## File ownership (M4 build)

| Area              | Files                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Shell core        | `shell/SiteShell.tsx` + module css + test, `shell/mode/*`, `entrypoints/inertia.tsx`, `system/DocShell.tsx` (skip-link removal) |
| Actions + Nav API | `shell/actions.ts` + test, `ds/components/Nav/{Nav.tsx,meta.ts,gallery.tsx,Nav.test.tsx}`, `data/manifest/nav.yml`              |
| Skim hub + stubs  | `pages/work/*`, `pages/resume/*`, `pages/colophon/*`                                                                            |
| Story scaffold    | `pages/home/*`, `pages/story/*`, `shell/story/*`                                                                                |
| 404               | `pages/errors/*` + request specs                                                                                                |
| Rails plumbing    | `config/routes.rb`, `app/controllers/*` (pre-landed)                                                                            |
