import type { PaletteAction } from '@/ds/components/Nav/palette'
import type { SkinMeta, SkinName } from '@/ds/tokens/generated/skins'
import { modeForPath } from '@/shell/mode/useMode'
import { CONTACT_EMAIL, LINKEDIN_URL } from '@/shell/contact'
import { markSkimVia, type EventKind } from '@/telemetry/track'

export { CONTACT_EMAIL }

export interface SiteActionDeps {
  /** Current path (usePage().url, query stripped). */
  currentPath: string
  /** Full skin registry; hidden skins are filtered here, not by callers. */
  skins: readonly SkinMeta[]
  setSkin: (name: SkinName) => void
  visit: (href: string) => void
  notify: (message: string) => void
  /** Optional telemetry sink — absent in tests that don't exercise tracking. */
  track?: (kind: EventKind, payload?: Record<string, unknown>) => void
}

export function buildSiteActions(deps: SiteActionDeps): PaletteAction[] {
  const { currentPath, skins, setSkin, visit, notify, track } = deps
  const mode = modeForPath(currentPath)

  const actions: PaletteAction[] = []

  // Wrap an action at push-time so every perform fires palette_action { id }.
  // Extra tracking (mode_switch, skin_switch) lives inside each perform below.
  function push(action: PaletteAction): void {
    if (track) {
      actions.push({
        ...action,
        perform: () => {
          track('palette_action', { id: action.id })
          action.perform()
        },
      })
    } else {
      actions.push(action)
    }
  }

  // ── Go group ────────────────────────────────────────────────────────────────
  push({
    id: 'nav-story',
    label: 'Story — home',
    group: 'Go',
    keywords: ['home', 'story', 'start'],
    perform: () => visit('/'),
  })
  push({
    id: 'nav-work',
    label: 'Work — the skim hub',
    group: 'Go',
    keywords: ['work', 'skim', 'studies', 'portfolio'],
    perform: () => visit('/work'),
  })
  push({
    id: 'nav-story-rails',
    label: 'Chapter 1 — The Rails era',
    group: 'Go',
    keywords: ['rails', 'chapter', '2014'],
    perform: () => visit('/story/rails-era'),
  })
  push({
    id: 'nav-story-react',
    label: 'Chapter 2 — The React era',
    group: 'Go',
    keywords: ['react', 'chapter'],
    perform: () => visit('/story/react-era'),
  })
  push({
    id: 'nav-story-agentic',
    label: 'Chapter 3 — The agentic era',
    group: 'Go',
    keywords: ['agentic', 'ai', 'chapter'],
    perform: () => visit('/story/agentic'),
  })
  push({
    id: 'nav-system',
    label: 'Design system',
    group: 'Go',
    keywords: ['ds', 'tokens', 'components', 'system'],
    perform: () => visit('/system'),
  })
  push({
    id: 'nav-resume',
    label: 'Résumé',
    group: 'Go',
    keywords: ['resume', 'cv', 'pdf', 'download'],
    perform: () => visit('/resume'),
  })
  push({
    id: 'nav-colophon',
    label: 'Colophon',
    group: 'Go',
    keywords: ['about', 'stack', 'craft', 'colophon'],
    perform: () => visit('/colophon'),
  })

  // ── Mode group (contextual) ─────────────────────────────────────────────────
  // On story routes offer only mode-skim; on skim routes offer only mode-story;
  // on neutral routes offer both (mode-skim first, matching the table order in
  // shell/README.md).
  if (mode !== 'skim') {
    push({
      id: 'mode-skim',
      label: 'Switch to skim mode',
      group: 'Mode',
      keywords: ['toggle', 'mode', 'skim'],
      perform: () => {
        markSkimVia('palette')
        if (track) track('mode_switch', { to: 'skim', via: 'palette' })
        visit('/work')
      },
    })
  }
  if (mode !== 'story') {
    push({
      id: 'mode-story',
      label: 'Switch to story mode',
      group: 'Mode',
      keywords: ['toggle', 'mode', 'story'],
      perform: () => {
        if (track) track('mode_switch', { to: 'story', via: 'palette' })
        visit('/')
      },
    })
  }

  // ── Skin group ──────────────────────────────────────────────────────────────
  // Non-hidden registry entries only — hidden skins (e.g. debug) are excluded.
  // Future skins join via the registry with zero shell edits.
  for (const skin of skins) {
    if (skin.hidden) continue
    push({
      id: `skin-${skin.name}`,
      label: `Skin: ${skin.label}`,
      group: 'Skin',
      keywords: ['skin', 'theme', 'era'],
      perform: () => {
        if (track) track('skin_switch', { to: skin.name })
        setSkin(skin.name as SkinName)
      },
    })
  }

  // ── Contact group ───────────────────────────────────────────────────────────
  push({
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

  push({
    id: 'open-linkedin',
    label: 'LinkedIn — open profile',
    group: 'Contact',
    keywords: ['linkedin', 'profile', 'social', 'network'],
    perform: () => {
      window.open(LINKEDIN_URL, '_blank', 'noopener')
    },
  })

  return actions
}
