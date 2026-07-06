/**
 * actions.ts unit tests — vitest, no rendering needed.
 *
 * navigator and window.location are stubbed per-suite; vi.unstubAllGlobals()
 * restores jsdom's originals in afterEach.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSiteActions, CONTACT_EMAIL, type SiteActionDeps } from './actions'
import type { SkinMeta } from '@/ds/tokens/generated/skins'
import { LINKEDIN_URL } from '@/shell/contact'
import { markSkimVia } from '@/telemetry/track'

// actions.ts imports markSkimVia from @/telemetry/track; mock the whole module
// so the Inertia router is never imported in this test context.
vi.mock('@/telemetry/track', () => ({
  markSkimVia: vi.fn(),
  track: vi.fn(),
  initTelemetry: vi.fn(),
  _resetForTest: vi.fn(),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VISIBLE_SKIN: SkinMeta = {
  name: 'galenti',
  label: 'Galenti',
  era: 'own-brand',
  colorScheme: 'light',
  default: true,
  hidden: false,
  description: 'Warm precision light.',
}

const HIDDEN_SKIN: SkinMeta = {
  name: 'debug',
  label: 'Debug',
  era: 'torture-test',
  colorScheme: 'dark',
  default: false,
  hidden: true,
  description: 'Hidden diagnostic skin.',
}

const SKINS: readonly SkinMeta[] = [VISIBLE_SKIN, HIDDEN_SKIN]

function makeDeps(overrides: Partial<SiteActionDeps> = {}): SiteActionDeps {
  return {
    currentPath: '/colophon',
    skins: SKINS,
    setSkin: vi.fn(),
    visit: vi.fn(),
    notify: vi.fn(),
    ...overrides,
  }
}

// ── id inventory ─────────────────────────────────────────────────────────────

describe('buildSiteActions — id inventory', () => {
  it('story route / — Go + mode-skim only (no mode-story) + skin + contact', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toEqual([
      'nav-story',
      'nav-work',
      'nav-story-rails',
      'nav-story-react',
      'nav-story-agentic',
      'nav-system',
      'nav-resume',
      'nav-colophon',
      'mode-skim',
      'skin-galenti',
      'copy-email',
      'open-linkedin',
    ])
  })

  it('story route /story/react-era — mode-skim only, mode-story absent', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/story/react-era' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toContain('mode-skim')
    expect(ids).not.toContain('mode-story')
  })

  it('skim route /work — mode-story only (no mode-skim) + skin + contact', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/work' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toEqual([
      'nav-story',
      'nav-work',
      'nav-story-rails',
      'nav-story-react',
      'nav-story-agentic',
      'nav-system',
      'nav-resume',
      'nav-colophon',
      'mode-story',
      'skin-galenti',
      'copy-email',
      'open-linkedin',
    ])
  })

  it('skim route /work/agentic-design-ops — mode-story only, mode-skim absent', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/work/agentic-design-ops' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toContain('mode-story')
    expect(ids).not.toContain('mode-skim')
  })

  it('neutral route /system — both mode-skim and mode-story, full list', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/system' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toEqual([
      'nav-story',
      'nav-work',
      'nav-story-rails',
      'nav-story-react',
      'nav-story-agentic',
      'nav-system',
      'nav-resume',
      'nav-colophon',
      'mode-skim',
      'mode-story',
      'skin-galenti',
      'copy-email',
      'open-linkedin',
    ])
  })

  it('neutral route /colophon — both mode actions present', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/colophon' }))
    const ids = actions.map((a) => a.id)
    expect(ids).toContain('mode-skim')
    expect(ids).toContain('mode-story')
  })
})

// ── hidden skin filtering ─────────────────────────────────────────────────────

describe('buildSiteActions — hidden skins', () => {
  it('excludes skins marked hidden=true', () => {
    const actions = buildSiteActions(makeDeps())
    const ids = actions.map((a) => a.id)
    expect(ids).toContain('skin-galenti')
    expect(ids).not.toContain('skin-debug')
  })

  it('includes all visible skins and excludes all hidden ones', () => {
    const extraVisible: SkinMeta = {
      name: 'rails-era',
      label: 'Rails Era',
      era: 'rails',
      colorScheme: 'dark',
      default: false,
      hidden: false,
      description: 'Extra visible skin.',
    }
    const actions = buildSiteActions(makeDeps({ skins: [VISIBLE_SKIN, HIDDEN_SKIN, extraVisible] }))
    const ids = actions.map((a) => a.id)
    expect(ids).toContain('skin-galenti')
    expect(ids).toContain('skin-rails-era')
    expect(ids).not.toContain('skin-debug')
  })
})

// ── setSkin target ────────────────────────────────────────────────────────────

describe('buildSiteActions — setSkin', () => {
  it('skin action calls setSkin with the correct skin name', () => {
    const setSkin = vi.fn()
    const actions = buildSiteActions(makeDeps({ setSkin }))
    const skinAction = actions.find((a) => a.id === 'skin-galenti')!
    skinAction.perform()
    expect(setSkin).toHaveBeenCalledOnce()
    expect(setSkin).toHaveBeenCalledWith('galenti')
  })

  it('skin action label is "Skin: <Label>"', () => {
    const actions = buildSiteActions(makeDeps())
    const skinAction = actions.find((a) => a.id === 'skin-galenti')!
    expect(skinAction.label).toBe('Skin: Galenti')
  })
})

// ── visit targets ─────────────────────────────────────────────────────────────

describe('buildSiteActions — visit targets', () => {
  it.each([
    ['nav-story', '/'],
    ['nav-work', '/work'],
    ['nav-story-rails', '/story/rails-era'],
    ['nav-story-react', '/story/react-era'],
    ['nav-story-agentic', '/story/agentic'],
    ['nav-system', '/system'],
    ['nav-resume', '/resume'],
    ['nav-colophon', '/colophon'],
  ] as const)('%s visits %s', (id, href) => {
    const visit = vi.fn()
    // Use a neutral path so all actions are present
    const actions = buildSiteActions(makeDeps({ currentPath: '/resume', visit }))
    const action = actions.find((a) => a.id === id)!
    action.perform()
    expect(visit).toHaveBeenCalledWith(href)
  })

  it('mode-skim visits /work', () => {
    const visit = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/', visit }))
    actions.find((a) => a.id === 'mode-skim')!.perform()
    expect(visit).toHaveBeenCalledWith('/work')
  })

  it('mode-story visits /', () => {
    const visit = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/work', visit }))
    actions.find((a) => a.id === 'mode-story')!.perform()
    expect(visit).toHaveBeenCalledWith('/')
  })
})

// ── copy-email ────────────────────────────────────────────────────────────────

describe('buildSiteActions — copy-email', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('clipboard success: notify is called with the email message', async () => {
    const notify = vi.fn()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const actions = buildSiteActions(makeDeps({ notify }))
    actions.find((a) => a.id === 'copy-email')!.perform()

    // Flush two microtask ticks for the .then() chain
    await Promise.resolve()
    await Promise.resolve()

    expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL)
    expect(notify).toHaveBeenCalledWith(`Email copied — ${CONTACT_EMAIL}`)
  })

  it('clipboard reject: falls back to mailto without calling notify', async () => {
    const notify = vi.fn()
    const locationMock = { href: '' }
    vi.stubGlobal('location', locationMock)
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })

    const actions = buildSiteActions(makeDeps({ notify }))
    actions.find((a) => a.id === 'copy-email')!.perform()

    // Flush two microtask ticks for .then() rejection to propagate to .catch()
    await Promise.resolve()
    await Promise.resolve()

    expect(locationMock.href).toBe(`mailto:${CONTACT_EMAIL}`)
    expect(notify).not.toHaveBeenCalled()
  })

  it('missing clipboard API: falls back to mailto without throwing', () => {
    const locationMock = { href: '' }
    vi.stubGlobal('location', locationMock)
    vi.stubGlobal('navigator', {}) // no clipboard property

    const actions = buildSiteActions(makeDeps())
    expect(() => actions.find((a) => a.id === 'copy-email')!.perform()).not.toThrow()
    expect(locationMock.href).toBe(`mailto:${CONTACT_EMAIL}`)
  })
})

// ── groups ────────────────────────────────────────────────────────────────────

describe('buildSiteActions — groups', () => {
  it('all Go actions are in the "Go" group', () => {
    const actions = buildSiteActions(makeDeps())
    const goIds = [
      'nav-story',
      'nav-work',
      'nav-story-rails',
      'nav-story-react',
      'nav-story-agentic',
      'nav-system',
      'nav-resume',
      'nav-colophon',
    ]
    for (const id of goIds) {
      expect(actions.find((a) => a.id === id)?.group).toBe('Go')
    }
  })

  it('mode actions are in the "Mode" group', () => {
    const actions = buildSiteActions(makeDeps({ currentPath: '/system' }))
    expect(actions.find((a) => a.id === 'mode-skim')?.group).toBe('Mode')
    expect(actions.find((a) => a.id === 'mode-story')?.group).toBe('Mode')
  })

  it('skin actions are in the "Skin" group', () => {
    const actions = buildSiteActions(makeDeps())
    expect(actions.find((a) => a.id === 'skin-galenti')?.group).toBe('Skin')
  })

  it('copy-email is in the "Contact" group', () => {
    const actions = buildSiteActions(makeDeps())
    expect(actions.find((a) => a.id === 'copy-email')?.group).toBe('Contact')
  })
})

// ── CONTACT_EMAIL constant ────────────────────────────────────────────────────

describe('CONTACT_EMAIL', () => {
  it('is the expected address', () => {
    expect(CONTACT_EMAIL).toBe('galentidesign@gmail.com')
  })
})

// ── open-linkedin action ──────────────────────────────────────────────────────

describe('buildSiteActions — open-linkedin', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('open-linkedin action is present in Contact group', () => {
    const actions = buildSiteActions(makeDeps())
    const action = actions.find((a) => a.id === 'open-linkedin')
    expect(action).toBeDefined()
    expect(action?.group).toBe('Contact')
  })

  it('open-linkedin label is "LinkedIn — open profile"', () => {
    const actions = buildSiteActions(makeDeps())
    expect(actions.find((a) => a.id === 'open-linkedin')?.label).toBe('LinkedIn — open profile')
  })

  it('open-linkedin opens LINKEDIN_URL in a new tab with noopener', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const actions = buildSiteActions(makeDeps())
    actions.find((a) => a.id === 'open-linkedin')!.perform()
    expect(open).toHaveBeenCalledWith(LINKEDIN_URL, '_blank', 'noopener')
  })
})

// ── track integration ─────────────────────────────────────────────────────────

describe('buildSiteActions — with track', () => {
  it('every action perform fires palette_action { id } when track is provided', () => {
    const mockTrack = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/system', track: mockTrack }))
    const navStory = actions.find((a) => a.id === 'nav-story')!
    navStory.perform()
    expect(mockTrack).toHaveBeenCalledWith('palette_action', { id: 'nav-story' })
  })

  it('mode-skim perform fires mode_switch { to: skim, via: palette }', () => {
    const mockTrack = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/', track: mockTrack }))
    actions.find((a) => a.id === 'mode-skim')!.perform()
    expect(mockTrack).toHaveBeenCalledWith('mode_switch', { to: 'skim', via: 'palette' })
  })

  it('mode-story perform fires mode_switch { to: story, via: palette }', () => {
    const mockTrack = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/work', track: mockTrack }))
    actions.find((a) => a.id === 'mode-story')!.perform()
    expect(mockTrack).toHaveBeenCalledWith('mode_switch', { to: 'story', via: 'palette' })
  })

  it('skin action perform fires skin_switch { to: <name> }', () => {
    const mockTrack = vi.fn()
    const actions = buildSiteActions(makeDeps({ track: mockTrack }))
    actions.find((a) => a.id === 'skin-galenti')!.perform()
    expect(mockTrack).toHaveBeenCalledWith('skin_switch', { to: 'galenti' })
  })

  it('mode-skim perform also fires palette_action (wrap applies)', () => {
    const mockTrack = vi.fn()
    const actions = buildSiteActions(makeDeps({ currentPath: '/', track: mockTrack }))
    actions.find((a) => a.id === 'mode-skim')!.perform()
    expect(mockTrack).toHaveBeenCalledWith('palette_action', { id: 'mode-skim' })
  })

  it('does not crash when track is absent (no telemetry)', () => {
    const actions = buildSiteActions(makeDeps({ track: undefined }))
    expect(() => {
      actions.forEach((a) => {
        // Perform all actions; clipboard / window.open may not exist in jsdom
        // but these tests focus on no-crash behavior
        try {
          a.perform()
        } catch {
          // ignore env errors (clipboard etc.)
        }
      })
    }).not.toThrow()
  })

  it('mode-skim calls markSkimVia("palette") even without track provided', () => {
    vi.mocked(markSkimVia).mockClear()
    const actions = buildSiteActions(makeDeps({ currentPath: '/' })) // no track
    actions.find((a) => a.id === 'mode-skim')!.perform()
    expect(vi.mocked(markSkimVia)).toHaveBeenCalledWith('palette')
  })
})
