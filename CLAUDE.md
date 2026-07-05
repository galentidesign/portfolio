# Portfolio — jgalenti.com

Rails 8.1 + Inertia (inertia_rails) + React 19 + TypeScript + Vite. PostgreSQL.
No SSR. No Tailwind — design tokens (JSON → CSS custom properties) + CSS
Modules only.

## Commands

- `bin/dev` — rails + vite dev servers (runs the token build first)
- `npm run tokens:build` — compile `ds/tokens/*.tokens.json` → `generated/`
  (CSS per skin, `skins.ts`, `skins.json`); required before rails boots
- `bin/rspec` — rails tests · `npm run test:unit` — vitest · `npm run test:e2e` — playwright
- `bin/rubocop` · `npm run lint` · `npm run typecheck` · `npm run format:check`
- `npm run lint:css` + `npm run lint:tokens` — token discipline (no `--raw-*`
  outside generated token CSS)
- `bin/leakcheck` — deny-list content gate; must pass before any commit

## Rules

- **Semantic tokens only in components** — components consume `--color-*`,
  `--radius-*`, `--type-*` etc.; `--raw-*` primitives live only in generated
  token CSS. Adding a skin = one JSON file + rebuild, zero component edits.
- **Motion** goes through the `useMotionPref()` gate — no animation may bypass
  reduced-motion handling.
- **A11y at build time**: keyboard + ARIA correctness is part of a component's
  definition of done, not a retrofit. Zero axe violations is the CI bar.
- **Git identity**: commits use the repo-local identity (J Galenti +
  GitHub noreply). Never commit with a different author.
- **Public repo**: no personal paths, private emails, or employer-internal
  names — `bin/leakcheck` enforces the deny-list (`.leakcheck.txt`).
- **Receipts**: each build session appends `docs/receipts/<date>-m<N>.md`
  (agents used, task shapes, notable workflow moments, commit stats).

## Structure

- `app/frontend/ds/` — tokens, components (each: `Component.tsx`,
  `styles.module.css`, `meta.ts`, test), motion helpers
- `app/frontend/shell/` — nav, palette, mode + skin providers
- `app/frontend/story/` · `app/frontend/studies/` · `app/frontend/pages/`
- `data/manifest/*.yml` — DS component manifest; DS doc pages are pure
  functions of it
- `docs/receipts/` — agent-build receipts (public, sanitized)
