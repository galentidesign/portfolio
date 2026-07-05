import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'nav',
  name: 'Nav (shell + palette)',
  tier: 'hero',
  description: 'Site shell bar with brand, primary navigation, and ⌘K command palette.',
  // No visual axes — Nav has no data-* variant dimensions; its palette open/close
  // state is behavioural, not a styling axis surfaced to the manifest.
  variants: {},
  props: [
    {
      name: 'brand',
      type: '{ label: string; href: string }',
      description: 'Brand name and href for the brand link.',
    },
    {
      name: 'items',
      type: 'readonly NavItem[]',
      description:
        'Primary nav links. NavItem: { label: string; href: string; current?: boolean }. ' +
        'current=true → aria-current="page" + accent underline.',
    },
    {
      name: 'actions',
      type: 'readonly PaletteAction[] | undefined',
      description:
        'Command palette actions. Presence enables the palette trigger and global shortcut. ' +
        'PaletteAction: { id: string; label: string; group?: string; keywords?: readonly string[]; perform: () => void }.',
    },
    {
      name: 'label',
      type: 'string',
      default: "'Primary'",
      description:
        'Accessible name for the nav landmark — must be unique when a page hosts more than one Nav.',
    },
    {
      name: 'skipTargetId',
      type: 'string',
      default: "'main'",
      description: 'id of the landmark the skip link jumps to.',
    },
    {
      name: 'enableShortcut',
      type: 'boolean',
      default: 'true',
      description: 'Mount a global ⌘K / Ctrl+K listener to open the palette.',
    },
    {
      name: 'linkAs',
      type: 'ElementType',
      default: "'a'",
      description:
        'Element type rendered for the brand and item links — pass a router Link ' +
        'for client-side navigation. The skip link stays a plain <a> (same-document jump).',
    },
  ],
} as const satisfies ComponentMeta
