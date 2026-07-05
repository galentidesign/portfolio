import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PlaygroundModule, PlaygroundValues } from '@/ds/components/playground'
import type { ManifestEntry } from './manifest'
import { Playground } from './Playground'

// ── Fixture ───────────────────────────────────────────────────────────────

const fixture: ManifestEntry = {
  slug: 'test-cmp',
  name: 'Test Component',
  tier: 'hero',
  status: 'stable',
  description: 'A component used to test the playground.',
  props: [
    {
      name: 'variant',
      type: "'a' | 'b' | 'c'",
      default: "'a'",
      description: 'Visual variant.',
    },
    {
      name: 'busy',
      type: 'boolean',
      default: 'false',
      description: 'Loading state.',
    },
    {
      name: 'label',
      type: 'string',
      description: 'Optional label text.',
    },
    {
      // playground: false — must not generate a control
      name: 'open',
      type: 'boolean',
      default: 'true',
      playground: false,
      description: 'Controlled open state.',
    },
    {
      // non-scalar type — must be skipped
      name: 'onChange',
      type: 'React.ChangeEventHandler',
      description: 'Change handler.',
    },
  ],
  tokens: [],
  a11y: { keyboard: [], aria: [], contrast: '' },
  usage: { do: [], dont: [] },
  example: '<TestCmp />',
  links: { repo: 'app/frontend/ds/components/TestCmp', figma: null },
}

// ── Spy host ──────────────────────────────────────────────────────────────

const snippetFn = vi.fn((attrs: string) => `<TestCmp${attrs} />`)

function HostComponent({ values }: { values: PlaygroundValues }) {
  return <div data-testid="host-render" data-values={JSON.stringify(values)} />
}

const fakeHost: PlaygroundModule = {
  playgroundMeta: { slug: 'test-cmp' },
  default: HostComponent,
  snippet: snippetFn,
}

// ── Helpers ───────────────────────────────────────────────────────────────

function renderPlayground() {
  return render(<Playground entry={fixture} host={fakeHost} />)
}

function getHostValues(): PlaygroundValues {
  const el = screen.getByTestId('host-render')
  return JSON.parse(el.dataset['values'] ?? '{}') as PlaygroundValues
}

function getSnippetCode(): string {
  // CodeBlock renders the code inside <pre role="group" aria-label="Snippet">
  const pre = screen.getByRole('group', { name: 'Snippet' })
  return pre.textContent ?? ''
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Playground', () => {
  it('generates a segmented control (radio group) for enum props', () => {
    renderPlayground()
    const group = screen.getByRole('radiogroup', { name: 'variant' })
    expect(group).toBeInTheDocument()
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(3)
    // Labels show the literal values
    expect(within(group).getByRole('radio', { name: 'a' })).toBeChecked()
    expect(within(group).getByRole('radio', { name: 'b' })).not.toBeChecked()
    expect(within(group).getByRole('radio', { name: 'c' })).not.toBeChecked()
  })

  it('generates a switch (checkbox) for boolean props', () => {
    renderPlayground()
    const checkbox = screen.getByRole('checkbox', { name: 'busy' })
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
  })

  it('generates a text input (FormField) for string props', () => {
    renderPlayground()
    const input = screen.getByRole('textbox', { name: 'label' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('skips playground:false props', () => {
    renderPlayground()
    // 'open' has playground: false — no control should render
    // There should be only one checkbox (busy), not two
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(1)
    expect(checkboxes[0]).toHaveAccessibleName('busy')
  })

  it('skips non-scalar props (handler types)', () => {
    renderPlayground()
    // 'onChange' is React.ChangeEventHandler — no control
    // Total controls: 1 radio group + 1 switch + 1 text input = 3 interactive groups
    expect(screen.queryByRole('textbox', { name: 'onChange' })).not.toBeInTheDocument()
  })

  it('renders the host inside the stage frame', () => {
    renderPlayground()
    const stage = screen.getByTestId('playground-stage')
    expect(within(stage).getByTestId('host-render')).toBeInTheDocument()
  })

  it('passes default values to the host (empty strings omitted)', () => {
    renderPlayground()
    // variant='a' is the default — passed through
    // busy=false — always passed
    // label='' — omitted (empty string)
    const vals = getHostValues()
    expect(vals['variant']).toBe('a')
    expect(vals['busy']).toBe(false)
    expect(vals['label']).toBeUndefined()
  })

  it('produces empty attrs when all values are at defaults', () => {
    renderPlayground()
    // All defaults → snippetFn called with ''
    const lastCall = snippetFn.mock.calls[snippetFn.mock.calls.length - 1]
    expect(lastCall?.[0]).toBe('')
  })

  it('userEvent: picking a non-default enum updates host values and snippet', async () => {
    const user = userEvent.setup()
    renderPlayground()

    const group = screen.getByRole('radiogroup', { name: 'variant' })
    await user.click(within(group).getByRole('radio', { name: 'b' }))

    expect(getHostValues()['variant']).toBe('b')
    expect(getSnippetCode()).toContain('variant="b"')
  })

  it('userEvent: picking the default enum value removes it from attrs', async () => {
    const user = userEvent.setup()
    renderPlayground()

    const group = screen.getByRole('radiogroup', { name: 'variant' })

    // Pick 'b' first, then back to 'a' (the default)
    await user.click(within(group).getByRole('radio', { name: 'b' }))
    await user.click(within(group).getByRole('radio', { name: 'a' }))

    expect(getSnippetCode()).not.toContain('variant')
  })

  it('userEvent: toggling a boolean adds the prop to attrs', async () => {
    const user = userEvent.setup()
    renderPlayground()

    await user.click(screen.getByRole('checkbox', { name: 'busy' }))

    expect(getHostValues()['busy']).toBe(true)
    expect(getSnippetCode()).toContain('busy')
    expect(getSnippetCode()).not.toContain('busy={false}')
  })

  it('userEvent: untoggling a boolean with default:false removes it from attrs', async () => {
    const user = userEvent.setup()
    renderPlayground()

    // Toggle on then off
    const checkbox = screen.getByRole('checkbox', { name: 'busy' })
    await user.click(checkbox)
    await user.click(checkbox)

    expect(getSnippetCode()).not.toContain('busy')
  })

  it('userEvent: typing in a string prop includes it in host values and attrs', async () => {
    const user = userEvent.setup()
    renderPlayground()

    await user.type(screen.getByRole('textbox', { name: 'label' }), 'hello')

    expect(getHostValues()['label']).toBe('hello')
    expect(getSnippetCode()).toContain('label="hello"')
  })

  it('userEvent: clearing a string prop omits it from host values', async () => {
    const user = userEvent.setup()
    renderPlayground()

    const input = screen.getByRole('textbox', { name: 'label' })
    await user.type(input, 'hello')
    await user.clear(input)

    expect(getHostValues()['label']).toBeUndefined()
    expect(getSnippetCode()).not.toContain('label')
  })
})
