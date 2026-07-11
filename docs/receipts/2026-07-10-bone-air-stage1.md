# 2026-07-10 — Bone & Air, Stage 1 (contract + tokens)

The taste-pass direction — **Bone & Air / Home-as-Story** — was accepted this
morning after a reference-anchored exploration round. This session landed
Stage 1 of the staged build: the direction contract as a repo doc, the galenti
bone token re-craft, and the react-era Roboto self-hosting fix. Zero component
edits by design — the whole visual change rides the token engine.

## What landed

- `docs/design-direction.md` — the execution contract: acceptance quotes,
  the nine-beat Home-as-Story storyboard, guardrails, staged landings, and
  the Stage 1 value record.
- `galenti.tokens.json` re-craft: `cream-*` ramp renamed and re-tuned to
  `bone-*` (surface `#faf6ee` → `#fcf9f3`, whiter and quieter); terracotta
  demoted (light-page glow quieted to 14%/8%, ember glow widened to
  40px/96px inside night islands); type scale & air (hero to
  `clamp(3.75rem, 1.5rem + 11vw, 13rem)` with 0.94 leading and −0.034em
  tracking, display/heading/numeral up in step, body-line 1.65); night zone
  re-tuned to island duty (`night-950` → `#0d0a08` for the starfield band).
  Semantic key set unchanged — skin parity untouched.
- react-era self-hosts Roboto: `roboto-latin-wght.woff2` (100–900) +
  `roboto-mono-latin-wght.woff2` (100–700) from fontsource-variable, OFL
  texts alongside, `meta.fonts` wired (Roboto preloads, Mono doesn't —
  the M10 LCP lesson). The skin had referenced Roboto since kilnlight while
  silently falling back to Helvetica.

## Verification

- WCAG audit (numeric, pre-commit, M1 pattern): **38/38 pairs pass** —
  every text pair ≥4.5:1, UI pairs ≥3:1, both bone page and night islands.
  The whiter ground raised every light-zone ratio.
- Battery: tokens:build · prettier/eslint/stylelint/token-lint/typecheck ·
  rubocop · leakcheck · bundle budgets · **966 unit / 244 rspec / 204 e2e**
  (axe matrix included), all green.
- One spec pin moved with the contract: `tokens.spec.ts` asserts the galenti
  surface color and now pins the bone value `rgb(252, 249, 243)`.
- Eyeball pass on home / work / tokens at 1440px against the test server:
  bone ground live, hero field and assembly intact, new scale renders.
  Noted for the staging walk: `/work`'s thesis at the new hero scale runs
  well past one viewport — its composition pass is Stage 3 scope.

## Session shape

Orchestrator inline throughout (token craft, audit, fonts, docs, battery);
one read-only recon subagent mapped the token engine, font wiring, and test
surface up front. Formatter lesson held: the contract doc was
prettier-checked via the direct binary before the battery closed. 4 scoped
commits.
