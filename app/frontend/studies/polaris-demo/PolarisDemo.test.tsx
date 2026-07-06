import { render, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'

// ----- Mock ?inline CSS -----
vi.mock('@shopify/polaris/build/esm/styles.css?inline', () => ({
  default: '/* polaris stub */',
}))

// ----- Mock Polaris with JSX stubs -----
vi.mock('@shopify/polaris', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => (
    <div data-polaris="AppProvider">{children}</div>
  ),
  Frame: ({ children }: { children: ReactNode }) => <div data-polaris="Frame">{children}</div>,
  Toast: ({ content }: { content: string }) => <div data-polaris="Toast">{content}</div>,
  Page: ({ children }: { children?: ReactNode }) => <div data-polaris="Page">{children}</div>,
  IndexTable: Object.assign(
    ({ children }: { children?: ReactNode }) => <div data-polaris="IndexTable">{children}</div>,
    {
      Row: ({ children }: { children?: ReactNode }) => (
        <div data-polaris="IndexTable.Row">{children}</div>
      ),
      Cell: ({ children }: { children?: ReactNode }) => (
        <div data-polaris="IndexTable.Cell">{children}</div>
      ),
    },
  ),
  Badge: ({ children }: { children?: ReactNode }) => <span data-polaris="Badge">{children}</span>,
  EmptyState: ({ children }: { children?: ReactNode }) => (
    <div data-polaris="EmptyState">{children}</div>
  ),
  Banner: ({ children }: { children?: ReactNode }) => <div data-polaris="Banner">{children}</div>,
  TextField: () => <input data-polaris="TextField" />,
  BlockStack: ({ children }: { children?: ReactNode }) => (
    <div data-polaris="BlockStack">{children}</div>
  ),
  InlineStack: ({ children }: { children?: ReactNode }) => (
    <div data-polaris="InlineStack">{children}</div>
  ),
  Card: ({ children }: { children?: ReactNode }) => <div data-polaris="Card">{children}</div>,
  Text: ({ children }: { children?: ReactNode }) => <span data-polaris="Text">{children}</span>,
  FormLayout: Object.assign(
    ({ children }: { children?: ReactNode }) => <div data-polaris="FormLayout">{children}</div>,
    {
      Group: ({ children }: { children?: ReactNode }) => (
        <div data-polaris="FormLayout.Group">{children}</div>
      ),
    },
  ),
  Select: () => <select data-polaris="Select" />,
  Checkbox: () => <input type="checkbox" data-polaris="Checkbox" />,
  ChoiceList: () => <div data-polaris="ChoiceList" />,
  Modal: Object.assign(
    ({ children }: { children?: ReactNode; open?: boolean }) => (
      <div data-polaris="Modal">{children}</div>
    ),
    {
      Section: ({ children }: { children?: ReactNode }) => (
        <div data-polaris="Modal.Section">{children}</div>
      ),
    },
  ),
  Button: ({ children }: { children?: ReactNode }) => (
    <button data-polaris="Button">{children}</button>
  ),
  Divider: () => <hr data-polaris="Divider" />,
  SkeletonPage: ({ children }: { children?: ReactNode }) => (
    <div data-polaris="SkeletonPage">{children}</div>
  ),
  SkeletonBodyText: () => <div data-polaris="SkeletonBodyText" />,
}))

// ----- Mock Polaris locale -----
vi.mock('@shopify/polaris/locales/en.json', () => ({ default: {} }))

// ----- Mock useMotionPref -----
vi.mock('@/ds/motion/useMotionPref', () => ({
  useMotionPref: () => ({ reduced: false, manualReduced: false, setManualReduced: vi.fn() }),
}))

// ----- Mock useDemoChores so views render without network -----
vi.mock('./useDemoChores', () => ({
  useDemoChores: () => ({
    status: 'success',
    chores: [
      {
        id: 1,
        title: 'Test chore',
        description: null,
        points: 10,
        recurrence: null,
        scheduled_time: null,
        requires_verification: false,
        is_sharable: false,
        is_multi_step: false,
        steps: [],
        assignees: [],
        household: { id: 1, name: 'Alder Row' },
      },
    ],
    households: [{ id: 1, name: 'Alder Row', children: [] }],
    error: null,
    retry: vi.fn(),
  }),
}))

// Import after all mocks.
const { default: PolarisDemo } = await import('./PolarisDemo')

// ----- Helpers -----

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...window.location,
      search,
      href: `http://localhost/work/shadcn-to-polaris/demo${search}`,
    },
  })
}

beforeEach(() => {
  setSearch('')
  vi.spyOn(window.history, 'pushState').mockImplementation(() => {})
  // Remove leftover style elements
  document.head.querySelectorAll('style[data-polaris-demo-styles]').forEach((el) => el.remove())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PolarisDemo', () => {
  it('mounts with data-polaris-demo-root attribute', () => {
    const { container } = render(<PolarisDemo demoState="success" />)
    expect(container.querySelector('[data-polaris-demo-root]')).not.toBeNull()
  })

  it('reflects demoState in data-state attribute', () => {
    const { container } = render(<PolarisDemo demoState="error" />)
    const root = container.querySelector('[data-polaris-demo-root]')
    expect(root?.getAttribute('data-state')).toBe('error')
  })

  it('defaults to index view (data-view="index") when no query param', () => {
    setSearch('')
    const { container } = render(<PolarisDemo demoState="success" />)
    const root = container.querySelector('[data-polaris-demo-root]')
    expect(root?.getAttribute('data-view')).toBe('index')
  })

  it('reads view=create from query param', () => {
    setSearch('?view=create')
    const { container } = render(<PolarisDemo demoState="success" />)
    const root = container.querySelector('[data-polaris-demo-root]')
    expect(root?.getAttribute('data-view')).toBe('create')
  })

  it('reads view=edit from query param', () => {
    setSearch('?view=edit&chore=1')
    const { container } = render(<PolarisDemo demoState="success" />)
    const root = container.querySelector('[data-polaris-demo-root]')
    expect(root?.getAttribute('data-view')).toBe('edit')
  })

  it('injects the polaris style element on mount', async () => {
    render(<PolarisDemo demoState="success" />)
    await waitFor(() => {
      expect(document.head.querySelector('style[data-polaris-demo-styles]')).not.toBeNull()
    })
  })

  it('removes the polaris style element on unmount', async () => {
    const { unmount } = render(<PolarisDemo demoState="success" />)
    await waitFor(() => {
      expect(document.head.querySelector('style[data-polaris-demo-styles]')).not.toBeNull()
    })
    unmount()
    expect(document.head.querySelector('style[data-polaris-demo-styles]')).toBeNull()
  })
})
