import type { ComponentMeta } from '../componentMeta'

export const meta = {
  slug: 'menu',
  name: 'Select / Menu',
  tier: 'gallery',
  description:
    'Menu button with a roving-focus action menu — WAI-ARIA APG menu button pattern on the native popover API.',
  variants: {
    align: ['start', 'end'],
  },
  props: [
    {
      name: 'label',
      type: 'string',
      description: 'Trigger button text; also wired as the menu aria-label.',
    },
    {
      name: 'items',
      type: 'readonly MenuItem[] — { id: string; label: string; disabled?: boolean; onSelect: () => void }',
      description:
        'Action items. Disabled items stay focusable and are announced as disabled (aria-disabled), but activation is a no-op.',
    },
    {
      name: 'align',
      type: "'start' | 'end'",
      default: "'start'",
      description:
        'Menu alignment relative to the trigger: start aligns left edges, end aligns right edges.',
    },
  ],
} as const satisfies ComponentMeta
