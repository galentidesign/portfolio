import type { PaletteAction } from '@/ds/components/Nav/palette'
import type { SkinMeta, SkinName } from '@/ds/tokens/generated/skins'
import { modeForPath } from '@/shell/mode/useMode'

export const CONTACT_EMAIL = 'galentidesign@gmail.com'

export interface SiteActionDeps {
  /** Current path (usePage().url, query stripped). */
  currentPath: string
  /** Full skin registry; hidden skins are filtered here, not by callers. */
  skins: readonly SkinMeta[]
  setSkin: (name: SkinName) => void
  visit: (href: string) => void
  notify: (message: string) => void
}

export function buildSiteActions(deps: SiteActionDeps): PaletteAction[] {
  const { currentPath, skins, setSkin, visit, notify } = deps
  const mode = modeForPath(currentPath)

  const actions: PaletteAction[] = []

  // ── Go group ────────────────────────────────────────────────────────────────
  actions.push(
    {
      id: 'nav-story',
      label: 'Story — home',
      group: 'Go',
      keywords: ['home', 'story', 'start'],
      perform: () => visit('/'),
    },
    {
      id: 'nav-work',
      label: 'Work — the skim hub',
      group: 'Go',
      keywords: ['work', 'skim', 'studies', 'portfolio'],
      perform: () => visit('/work'),
    },
    {
      id: 'nav-story-rails',
      label: 'Chapter 1 — The Rails era',
      group: 'Go',
      keywords: ['rails', 'chapter', '2014'],
      perform: () => visit('/story/rails-era'),
    },
    {
      id: 'nav-story-react',
      label: 'Chapter 2 — The React era',
      group: 'Go',
      keywords: ['react', 'chapter'],
      perform: () => visit('/story/react-era'),
    },
    {
      id: 'nav-story-agentic',
      label: 'Chapter 3 — The agentic era',
      group: 'Go',
      keywords: ['agentic', 'ai', 'chapter'],
      perform: () => visit('/story/agentic'),
    },
    {
      id: 'nav-system',
      label: 'Design system',
      group: 'Go',
      keywords: ['ds', 'tokens', 'components', 'system'],
      perform: () => visit('/system'),
    },
    {
      id: 'nav-resume',
      label: 'Résumé',
      group: 'Go',
      keywords: ['resume', 'cv', 'pdf', 'download'],
      perform: () => visit('/resume'),
    },
    {
      id: 'nav-colophon',
      label: 'Colophon',
      group: 'Go',
      keywords: ['about', 'stack', 'craft', 'colophon'],
      perform: () => visit('/colophon'),
    },
  )

  // ── Mode group (contextual) ─────────────────────────────────────────────────
  // On story routes offer only mode-skim; on skim routes offer only mode-story;
  // on neutral routes offer both (mode-skim first, matching the table order in
  // shell/README.md).
  if (mode !== 'skim') {
    actions.push({
      id: 'mode-skim',
      label: 'Switch to skim mode',
      group: 'Mode',
      keywords: ['toggle', 'mode', 'skim'],
      perform: () => visit('/work'),
    })
  }
  if (mode !== 'story') {
    actions.push({
      id: 'mode-story',
      label: 'Switch to story mode',
      group: 'Mode',
      keywords: ['toggle', 'mode', 'story'],
      perform: () => visit('/'),
    })
  }

  // ── Skin group ──────────────────────────────────────────────────────────────
  // Non-hidden registry entries only — hidden skins (e.g. debug) are excluded.
  // Future skins join via the registry with zero shell edits.
  for (const skin of skins) {
    if (skin.hidden) continue
    actions.push({
      id: `skin-${skin.name}`,
      label: `Skin: ${skin.label}`,
      group: 'Skin',
      keywords: ['skin', 'theme', 'era'],
      perform: () => setSkin(skin.name as SkinName),
    })
  }

  // ── Contact group ───────────────────────────────────────────────────────────
  actions.push({
    id: 'copy-email',
    label: 'Copy email address',
    group: 'Contact',
    keywords: ['email', 'contact', 'mail'],
    perform: () => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard
          .writeText(CONTACT_EMAIL)
          .then(() => {
            notify(`Email copied — ${CONTACT_EMAIL}`)
          })
          .catch(() => {
            window.location.href = `mailto:${CONTACT_EMAIL}`
          })
      } else {
        window.location.href = `mailto:${CONTACT_EMAIL}`
      }
    },
  })

  return actions
}
